import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import type {
    SceneId,
    SceneLifecycleControl,
    SceneRequest,
    SceneRequestResult,
    SceneVisualTransitionPhase,
} from "../types/scene";
import {
    advanceSceneTransition,
    createSceneTransitionState,
    requestSceneTransition,
    type SceneTransitionState,
} from "./sceneTransitionState";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS } from "./mainCircleTravel";

export type SlideshowCoordinatorSnapshot = SceneTransitionState & {
    activeSceneId: SceneId | null;
    busy: boolean;
    travelProgress: number;
};

export type SlideshowTravelDriver = (callbacks: {
    onComplete: () => void;
    onProgress: (progress: number) => void;
}) => () => void;

export type SlideshowCoordinator = {
    completeSceneTransition: (sceneId: SceneId, phase: SceneVisualTransitionPhase) => void;
    dispose: () => void;
    getSnapshot: () => SlideshowCoordinatorSnapshot;
    requestScene: (request: SceneRequest) => SceneRequestResult;
    subscribe: (listener: () => void) => () => void;
};

export type SlideshowCoordinatorOptions = {
    startTravel?: SlideshowTravelDriver;
};

// Creates the phase owner that waits for Section completion around one travel clock.
export function createSlideshowCoordinator(
    initialSceneId: SceneId,
    options: SlideshowCoordinatorOptions = {},
): SlideshowCoordinator {
    const listeners = new Set<() => void>();
    const startTravel = options.startTravel ?? startGsapTravel;
    let transitionState = createSceneTransitionState(initialSceneId);
    let travelProgress = 0;
    let cancelTravel: (() => void) | null = null;
    let disposed = false;
    let snapshot = coordinatorSnapshot(transitionState, travelProgress);

    // Publishes one immutable snapshot after state or travel progress changes.
    const publish = () => {
        snapshot = coordinatorSnapshot(transitionState, travelProgress);
        listeners.forEach((listener) => listener());
    };

    // Completes travel only when the controller still owns the moving phase.
    const completeTravel = () => {
        if (disposed || transitionState.phase !== "moving") return;
        cancelTravel = null;
        travelProgress = 1;
        transitionState = advanceSceneTransition(transitionState);
        publish();
    };

    return {
        completeSceneTransition(sceneId, phase) {
            if (disposed || transitionState.phase !== phase) return;
            const expectedSceneId = phase === "closing"
                ? transitionState.currentSceneId
                : transitionState.requestedSceneId;
            if (sceneId !== expectedSceneId) return;

            transitionState = advanceSceneTransition(transitionState);
            if (transitionState.phase === "moving") {
                travelProgress = 0;
                publish();
                cancelTravel = startTravel({
                    onProgress(progress) {
                        if (disposed || transitionState.phase !== "moving") return;
                        travelProgress = clamp(progress, 0, 1);
                        publish();
                    },
                    onComplete: completeTravel,
                });
                return;
            }

            travelProgress = 0;
            publish();
        },
        dispose() {
            disposed = true;
            cancelTravel?.();
            cancelTravel = null;
            listeners.clear();
        },
        getSnapshot: () => snapshot,
        requestScene(request) {
            if (disposed) return { status: "ignored", reason: "busy" };
            const update = requestSceneTransition(transitionState, request);
            if (update.state !== transitionState) {
                transitionState = update.state;
                travelProgress = 0;
                publish();
            }
            return update.result;
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

// Exposes a stable coordinator instance and Section-specific lifecycle adapters to React.
export function useSlideshowCoordinator(
    initialSceneId: SceneId,
    options: SlideshowCoordinatorOptions = {},
) {
    const controllerRef = useRef<SlideshowCoordinator | null>(null);
    if (!controllerRef.current) {
        controllerRef.current = createSlideshowCoordinator(initialSceneId, options);
    }
    const controller = controllerRef.current;
    const snapshot = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot,
    );

    useEffect(() => () => controller.dispose(), [controller]);

    const lifecycleFor = useCallback((sceneId: SceneId): SceneLifecycleControl => ({
        active: snapshot.activeSceneId === sceneId,
        phase: snapshot.phase,
        onTransitionComplete: (phase) => controller.completeSceneTransition(sceneId, phase),
    }), [controller, snapshot.activeSceneId, snapshot.phase]);

    return {
        ...snapshot,
        lifecycleFor,
        requestScene: controller.requestScene,
    };
}

// Runs the provisional one-second normalized travel clock without owning geometry.
function startGsapTravel({ onComplete, onProgress }: Parameters<SlideshowTravelDriver>[0]) {
    const clock = { progress: 0 };
    const tween = gsap.to(clock, {
        progress: 1,
        duration: MAIN_CIRCLE_TRAVEL_DURATION_MS / 1000,
        ease: "none",
        onUpdate: () => onProgress(clock.progress),
        onComplete,
    });
    return () => tween.kill();
}

// Combines pure transition state with the coordinator's derived public fields.
function coordinatorSnapshot(
    state: SceneTransitionState,
    travelProgress: number,
): SlideshowCoordinatorSnapshot {
    return {
        ...state,
        activeSceneId: state.phase === "moving" ? null : state.currentSceneId,
        busy: state.phase !== "idle",
        travelProgress,
    };
}

// Keeps injected travel drivers from publishing progress outside the valid range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
