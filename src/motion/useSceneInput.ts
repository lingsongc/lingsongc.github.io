import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type {
    SceneDirection,
    SceneId,
    ScenePhase,
    SceneRequest,
    SceneRequestResult,
} from "../types/scene";
import {
    canScrollScene,
    firstScrollableOwnerIndex,
    hardEdgeResistance,
    isTerminalSceneDirection,
    keyboardSceneDirection,
    keyboardScrollDistance,
    releasedTouchDirection,
    returningResistance,
    touchDragIntent,
    touchVerticalProgress,
} from "./sceneInputIntent";
import {
    applyWheelIntent,
    createWheelIntentState,
    normalizeWheelDelta,
    releaseWheelNeutrality,
    wheelIntentProgress,
    WHEEL_INTENT_PAUSE_MS,
    WHEEL_INTENT_RETURN_MS,
    type WheelIntentState,
} from "./wheelIntent";

type SceneInputOptions = {
    activeScrollerRef: RefObject<HTMLDivElement | null>;
    currentSceneId: SceneId;
    phase: ScenePhase;
    reducedMotion: boolean;
    requestScene: (request: SceneRequest) => SceneRequestResult;
};

type TouchGesture = {
    axis: "pending" | "vertical";
    identifier: number;
    progress: number;
    scrollOwners: HTMLElement[];
    startX: number;
    startY: number;
};

// Owns page-level wheel, touch, and keyboard intent around the scene coordinator.
export function useSceneInput({
    activeScrollerRef,
    currentSceneId,
    phase,
    reducedMotion,
    requestScene,
}: SceneInputOptions) {
    const [resistanceProgress, setResistanceProgress] = useState(0);
    const resistanceRef = useRef(0);
    const wheelIntentRef = useRef(createWheelIntentState());
    const touchGestureRef = useRef<TouchGesture | null>(null);
    const previousPhaseRef = useRef(phase);
    const returnFrameRef = useRef(0);
    const returnTimerRef = useRef<number | undefined>(undefined);
    const neutralTimerRef = useRef<number | undefined>(undefined);

    // Publishes the one resistance value shared by the composition and grid.
    const publishResistance = useCallback((progress: number) => {
        resistanceRef.current = progress;
        setResistanceProgress(progress);
    }, []);

    // Stops pending timers and animation frames before replacing input state.
    const cancelScheduledWork = useCallback(() => {
        window.clearTimeout(returnTimerRef.current);
        window.clearTimeout(neutralTimerRef.current);
        cancelAnimationFrame(returnFrameRef.current);
        returnTimerRef.current = undefined;
        neutralTimerRef.current = undefined;
        returnFrameRef.current = 0;
    }, []);

    // Returns a touch or hard-edge response immediately over the shared return duration.
    const startImmediateReturn = useCallback((initialProgress: number) => {
        window.clearTimeout(returnTimerRef.current);
        cancelAnimationFrame(returnFrameRef.current);
        const startedAt = performance.now();
        const renderReturn = (now: number) => {
            const progress = returningResistance(
                initialProgress,
                now - startedAt,
                WHEEL_INTENT_RETURN_MS,
            );
            publishResistance(progress);
            if (progress === 0) {
                wheelIntentRef.current = createWheelIntentState();
                returnFrameRef.current = 0;
                return;
            }
            returnFrameRef.current = requestAnimationFrame(renderReturn);
        };
        returnFrameRef.current = requestAnimationFrame(renderReturn);
    }, [publishResistance]);

    // Clears all visible resistance so explicit navigation can bypass the gate.
    const cancelResistance = useCallback(() => {
        cancelScheduledWork();
        wheelIntentRef.current = createWheelIntentState();
        touchGestureRef.current = null;
        publishResistance(0);
    }, [cancelScheduledWork, publishResistance]);

    // Shows a smaller response that restarts rather than accumulating at a terminal edge.
    const showHardEdge = useCallback((direction: SceneDirection, magnitude = 1) => {
        cancelScheduledWork();
        wheelIntentRef.current = createWheelIntentState();
        const progress = hardEdgeResistance(direction, magnitude);
        publishResistance(progress);
        startImmediateReturn(progress);
    }, [cancelScheduledWork, publishResistance, startImmediateReturn]);

    useEffect(() => cancelScheduledWork, [cancelScheduledWork]);

    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        previousPhaseRef.current = phase;
        if (phase !== "idle") {
            cancelResistance();
            return;
        }
        if (previousPhase === "idle") return;

        // A completed transition must observe a quiet interval before accepting momentum.
        wheelIntentRef.current = createWheelIntentState(true, performance.now());
    }, [cancelResistance, phase]);

    useEffect(() => {
        if (phase !== "idle") return;

        // Rechecks neutrality from the most recent momentum event.
        const scheduleNeutralRelease = () => {
            window.clearTimeout(neutralTimerRef.current);
            neutralTimerRef.current = window.setTimeout(() => {
                const released = releaseWheelNeutrality(wheelIntentRef.current, performance.now());
                wheelIntentRef.current = released;
                if (released.neutralRequired) scheduleNeutralRelease();
            }, WHEEL_INTENT_PAUSE_MS);
        };

        // Animates incomplete wheel intent after its pause without owning geometry.
        const scheduleWheelReturn = (state: WheelIntentState) => {
            window.clearTimeout(returnTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
            const delay = Math.max(0, (state.lastInputAt ?? performance.now())
                + WHEEL_INTENT_PAUSE_MS - performance.now());
            returnTimerRef.current = window.setTimeout(() => {
                const renderReturn = (now: number) => {
                    const progress = wheelIntentProgress(wheelIntentRef.current, now);
                    publishResistance(progress);
                    if (progress === 0) {
                        wheelIntentRef.current = createWheelIntentState();
                        returnFrameRef.current = 0;
                        return;
                    }
                    returnFrameRef.current = requestAnimationFrame(renderReturn);
                };
                returnFrameRef.current = requestAnimationFrame(renderReturn);
            }, delay);
        };

        // Converts only unclaimed vertical wheel activity into slideshow intent.
        const handleWheel = (event: WheelEvent) => {
            if (
                event.defaultPrevented
                || event.ctrlKey
                || Math.abs(event.deltaY) <= Math.abs(event.deltaX)
            ) return;

            const impulse = normalizeWheelDelta(event.deltaY, event.deltaMode);
            if (impulse === 0) return;
            const now = performance.now();
            const direction = impulse > 0 ? "forward" : "backward";
            const scrollOwners = inputScrollOwners(event.target, activeScrollerRef.current);

            if (firstScrollableOwner(scrollOwners, direction)) {
                wheelIntentRef.current = createWheelIntentState(true, now);
                scheduleNeutralRelease();
                return;
            }

            event.preventDefault();

            if (wheelIntentRef.current.neutralRequired) {
                wheelIntentRef.current = applyWheelIntent(
                    wheelIntentRef.current,
                    impulse,
                    now,
                ).state;
                scheduleNeutralRelease();
                return;
            }

            if (isTerminalSceneDirection(currentSceneId, direction)) {
                if (!reducedMotion) showHardEdge(direction, impulse);
                return;
            }

            window.clearTimeout(returnTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
            const update = applyWheelIntent(wheelIntentRef.current, impulse, now);
            wheelIntentRef.current = update.state;

            if (!update.committedDirection) {
                publishResistance(reducedMotion ? 0 : wheelIntentProgress(update.state, now));
                scheduleWheelReturn(update.state);
                return;
            }

            publishResistance(0);
            requestScene({
                kind: "adjacent",
                direction: update.committedDirection,
                source: "wheel",
            });
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        if (wheelIntentRef.current.neutralRequired) scheduleNeutralRelease();
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.clearTimeout(returnTimerRef.current);
            window.clearTimeout(neutralTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
        };
    }, [activeScrollerRef, currentSceneId, phase, publishResistance, reducedMotion, requestScene, showHardEdge]);

    useEffect(() => {
        if (phase !== "idle") return;

        // Begins one candidate gesture only outside interactive input owners.
        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1) {
                touchGestureRef.current = null;
                if (resistanceRef.current !== 0) startImmediateReturn(resistanceRef.current);
                return;
            }
            if (isInteractiveInputTarget(event.target)) return;
            const touch = event.touches[0];
            touchGestureRef.current = {
                axis: "pending",
                identifier: touch.identifier,
                progress: 0,
                scrollOwners: inputScrollOwners(event.target, activeScrollerRef.current),
                startX: touch.clientX,
                startY: touch.clientY,
            };
        };

        // Lets native scrolling win, otherwise makes the composition follow the finger.
        const handleTouchMove = (event: TouchEvent) => {
            const gesture = touchGestureRef.current;
            if (!gesture || event.touches.length !== 1) return;
            const touch = [...event.touches].find(({ identifier }) => identifier === gesture.identifier);
            if (!touch) return;
            const resolvedIntent = touchDragIntent(
                gesture.startX,
                gesture.startY,
                touch.clientX,
                touch.clientY,
            );
            const intent = gesture.axis === "vertical"
                ? {
                    axis: "vertical" as const,
                    progress: touchVerticalProgress(gesture.startY, touch.clientY),
                }
                : resolvedIntent;
            if (intent.axis === "pending") return;
            if (intent.axis === "horizontal") {
                touchGestureRef.current = null;
                return;
            }

            if (intent.progress === 0) {
                event.preventDefault();
                gesture.axis = "vertical";
                gesture.progress = 0;
                publishResistance(0);
                return;
            }

            const direction = intent.progress > 0 ? "forward" : "backward";
            if (gesture.axis === "pending" && firstScrollableOwner(gesture.scrollOwners, direction)) {
                touchGestureRef.current = null;
                return;
            }

            event.preventDefault();
            gesture.axis = "vertical";
            gesture.progress = intent.progress;
            publishResistance(reducedMotion ? 0 : isTerminalSceneDirection(currentSceneId, direction)
                ? hardEdgeResistance(direction, intent.progress)
                : intent.progress);
        };

        // Commits a completed swipe on release, otherwise returns it to rest.
        const handleTouchEnd = (event: TouchEvent) => {
            const gesture = touchGestureRef.current;
            if (!gesture || ![...event.changedTouches].some(
                ({ identifier }) => identifier === gesture.identifier,
            )) return;
            touchGestureRef.current = null;
            if (gesture.axis !== "vertical" || gesture.progress === 0) return;

            const direction = gesture.progress > 0 ? "forward" : "backward";
            if (isTerminalSceneDirection(currentSceneId, direction)) {
                startImmediateReturn(resistanceRef.current);
                return;
            }
            const releasedDirection = releasedTouchDirection(gesture.progress);
            if (!releasedDirection) {
                startImmediateReturn(resistanceRef.current);
                return;
            }

            publishResistance(0);
            requestScene({ kind: "adjacent", direction: releasedDirection, source: "touch" });
        };

        // Treats browser cancellation like an incomplete release.
        const handleTouchCancel = () => {
            if (!touchGestureRef.current) return;
            touchGestureRef.current = null;
            startImmediateReturn(resistanceRef.current);
        };

        window.addEventListener("touchstart", handleTouchStart, { passive: true });
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleTouchEnd, { passive: true });
        window.addEventListener("touchcancel", handleTouchCancel, { passive: true });
        return () => {
            window.removeEventListener("touchstart", handleTouchStart);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleTouchEnd);
            window.removeEventListener("touchcancel", handleTouchCancel);
        };
    }, [activeScrollerRef, currentSceneId, phase, publishResistance, reducedMotion, requestScene, startImmediateReturn]);

    useEffect(() => {
        if (phase !== "idle") return;

        // Sends only unclaimed deliberate keys directly to the adjacent scene.
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat || isInteractiveInputTarget(event.target)) return;
            const direction = keyboardSceneDirection(event.key);
            if (!direction) return;
            const scrollOwner = firstScrollableOwner(
                inputScrollOwners(event.target, activeScrollerRef.current),
                direction,
            );
            if (scrollOwner) {
                event.preventDefault();
                const distance = keyboardScrollDistance(event.key, scrollOwner.clientHeight);
                scrollOwner.scrollBy({
                    top: direction === "forward" ? distance : -distance,
                    behavior: "auto",
                });
                return;
            }

            event.preventDefault();
            cancelResistance();
            requestScene({ kind: "adjacent", direction, source: "keyboard" });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeScrollerRef, cancelResistance, phase, requestScene]);

    return { cancelResistance, resistanceProgress };
}

// Leaves native controls and Section-declared gesture owners in charge of their input.
function isInteractiveInputTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return target.closest(
        "a, button, input, textarea, select, option, [contenteditable]:not([contenteditable='false']), [role='button'], [role='slider'], [role='listbox']",
    ) !== null;
}

// Orders the target's nested viewport before the active Section viewport.
function inputScrollOwners(target: EventTarget | null, activeScroller: HTMLElement | null) {
    const nestedOwner = target instanceof Element
        ? target.closest<HTMLElement>("[data-scene-scroll-owner]")
        : null;
    return nestedOwner && nestedOwner !== activeScroller
        ? [nestedOwner, ...(activeScroller ? [activeScroller] : [])]
        : activeScroller ? [activeScroller] : [];
}

// Returns the first viewport that can still move in the requested direction.
function firstScrollableOwner(owners: readonly HTMLElement[], direction: SceneDirection) {
    const index = firstScrollableOwnerIndex(owners, direction);
    return index === null ? null : owners[index];
}
