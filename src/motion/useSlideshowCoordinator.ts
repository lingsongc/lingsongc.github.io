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
    recoverSceneTransition,
    requestSceneTransition,
    type SceneTransitionState,
} from "./sceneTransitionState";
import { sceneIdFromHash, sceneUrl } from "./sceneHistory";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS } from "./mainCircleTravel";

export type SlideshowCoordinatorSnapshot = SceneTransitionState & {
    activeSceneId: SceneId | null;
    busy: boolean;
    settledVersion: number;
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
    recover: (reason: "resize" | "orientation-change" | "document-hidden") => boolean;
    requestScene: (request: SceneRequest) => SceneRequestResult;
    setReducedMotion: (reducedMotion: boolean) => void;
    subscribe: (listener: () => void) => () => void;
};

export type SlideshowCoordinatorOptions = {
    reducedMotion?: boolean;
    startTravel?: SlideshowTravelDriver;
};

// Creates the phase owner that waits for Section completion around one travel clock.
export function createSlideshowCoordinator(
    initialSceneId: SceneId,
    options: SlideshowCoordinatorOptions = {},
): SlideshowCoordinator {
    const listeners = new Set<() => void>();
    const startTravel = options.startTravel ?? startGsapTravel;
    let reducedMotion = options.reducedMotion ?? false;
    let transitionState = createSceneTransitionState(initialSceneId);
    let settledVersion = 0;
    let travelProgress = 0;
    let cancelTravel: (() => void) | null = null;
    let disposed = false;
    let snapshot = coordinatorSnapshot(transitionState, travelProgress, settledVersion);

    // Publishes one immutable snapshot after state or travel progress changes.
    const publish = () => {
        snapshot = coordinatorSnapshot(transitionState, travelProgress, settledVersion);
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

    // Cancels active work and makes the requested destination the only valid resting state.
    const recover = (reason: "resize" | "orientation-change" | "document-hidden") => {
        if (disposed || transitionState.phase === "idle") return false;
        cancelTravel?.();
        cancelTravel = null;
        transitionState = recoverSceneTransition(transitionState, reason);
        travelProgress = 0;
        settledVersion += 1;
        publish();
        return true;
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
        recover,
        requestScene(request) {
            if (disposed) return { status: "ignored", reason: "busy" };
            const update = requestSceneTransition(transitionState, request);
            if (update.result.status === "accepted" && reducedMotion) {
                transitionState = createSceneTransitionState(update.result.destinationSceneId);
                travelProgress = 0;
                settledVersion += 1;
                publish();
                return update.result;
            }
            if (update.state !== transitionState) {
                transitionState = update.state;
                travelProgress = 0;
                publish();
            }
            return update.result;
        },
        setReducedMotion(value) {
            reducedMotion = value;
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
    const effectVersionRef = useRef(0);
    if (!controllerRef.current) {
        controllerRef.current = createSlideshowCoordinator(initialSceneId, options);
    }
    const controller = controllerRef.current;
    const lastHandledHashRef = useRef(window.location.hash);
    const snapshot = useSyncExternalStore(
        controller.subscribe,
        controller.getSnapshot,
        controller.getSnapshot,
    );
    const lastSettledVersionRef = useRef(snapshot.settledVersion);

    useEffect(() => {
        const effectVersion = ++effectVersionRef.current;
        return () => {
            // Strict Mode immediately recreates effects, so defer disposal until a genuine unmount.
            queueMicrotask(() => {
                if (effectVersionRef.current === effectVersion) controller.dispose();
            });
        };
    }, [controller]);

    useEffect(
        () => controller.setReducedMotion(options.reducedMotion ?? false),
        [controller, options.reducedMotion],
    );

    useEffect(() => {
        // Replaces only malformed initial hashes; an absent hash remains the valid Home default.
        if (!window.location.hash || sceneIdFromHash(window.location.hash)) return;
        lastHandledHashRef.current = "#home";
        window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
    }, []);

    useEffect(() => {
        // Writes on normal arrival or an immediate environmental and reduced-motion settlement.
        const arrivedDuringOpening = snapshot.phase === "opening"
            && snapshot.requestedSceneId === snapshot.currentSceneId;
        const arrivedImmediately = snapshot.settledVersion !== lastSettledVersionRef.current;
        if (!arrivedDuringOpening && !arrivedImmediately) return;
        lastSettledVersionRef.current = snapshot.settledVersion;
        if (sceneIdFromHash(window.location.hash) === snapshot.currentSceneId) return;

        lastHandledHashRef.current = `#${snapshot.currentSceneId}`;
        window.history.pushState(
            { sceneId: snapshot.currentSceneId },
            "",
            sceneUrl(snapshot.currentSceneId, window.location),
        );
    }, [snapshot.currentSceneId, snapshot.phase, snapshot.requestedSceneId, snapshot.settledVersion]);

    useEffect(() => {
        // Stops a busy timeline rather than leaving geometry half-way through a changed environment.
        const handleResize = () => controller.recover("resize");
        const handleOrientationChange = () => controller.recover("orientation-change");
        const handleVisibilityChange = () => {
            if (document.hidden) controller.recover("document-hidden");
        };

        window.addEventListener("resize", handleResize);
        window.addEventListener("orientationchange", handleOrientationChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("orientationchange", handleOrientationChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [controller]);

    useEffect(() => {
        // Routes native Back, Forward, and manually changed hashes through the direct coordinator path.
        const requestLocationScene = () => {
            const hash = window.location.hash;
            if (hash === lastHandledHashRef.current) return;
            lastHandledHashRef.current = hash;

            const destinationSceneId = sceneIdFromHash(hash);
            if (!destinationSceneId) {
                lastHandledHashRef.current = "#home";
                window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
                controller.requestScene({
                    kind: "direct",
                    destinationSceneId: "home",
                    source: "history",
                });
                return;
            }
            controller.requestScene({
                kind: "direct",
                destinationSceneId,
                source: "history",
            });
        };

        window.addEventListener("popstate", requestLocationScene);
        window.addEventListener("hashchange", requestLocationScene);
        return () => {
            window.removeEventListener("popstate", requestLocationScene);
            window.removeEventListener("hashchange", requestLocationScene);
        };
    }, [controller]);

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
    settledVersion: number,
): SlideshowCoordinatorSnapshot {
    return {
        ...state,
        activeSceneId: state.phase === "moving" ? null : state.currentSceneId,
        busy: state.phase !== "idle",
        settledVersion,
        travelProgress,
    };
}

// Keeps injected travel drivers from publishing progress outside the valid range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
