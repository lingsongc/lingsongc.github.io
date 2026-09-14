import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { SceneDirection, SceneId, ScenePhase, SceneRequest, SceneRequestResult } from "../types/scene";
import {
    applyWheelIntent, createWheelIntentState, firstScrollableOwnerIndex,
    isTerminalSceneDirection, keyboardSceneDirection, keyboardScrollDistance,
    normalizeWheelDelta, releaseWheelNeutrality, releasedTouchDirection,
    touchDragIntent, touchVerticalProgress, WHEEL_INTENT_PAUSE_MS, WHEEL_INTENT_THRESHOLD,
} from "./sceneInputModel";

const WHEEL_FEEDBACK_RESET_MS = 180;
const WHEEL_FEEDBACK_EVENT_MS = 140;
const WHEEL_FEEDBACK_HOLD_MS = 60;
const WHEEL_FEEDBACK_RETURN_MS = 300;

type SceneInputOptions = {
    activeScrollerRef: RefObject<HTMLDivElement | null>;
    currentSceneId: SceneId;
    onWheelFeedbackChange: (progress: number, durationMs: number) => void;
    phase: ScenePhase;
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

// Owns page-level wheel, touch, and keyboard events around the pure input model.
export function useSceneInput({
    activeScrollerRef,
    currentSceneId,
    onWheelFeedbackChange,
    phase,
    requestScene,
}: SceneInputOptions) {
    const wheelIntentRef = useRef(createWheelIntentState());
    const touchGestureRef = useRef<TouchGesture | null>(null);
    const previousPhaseRef = useRef(phase);
    const intentTimerRef = useRef<number | undefined>(undefined);
    const commitTimerRef = useRef<number | undefined>(undefined);
    const neutralTimerRef = useRef<number | undefined>(undefined);

    // Cancels accumulated browser-event state before a direct request or phase change.
    const cancelPendingInput = useCallback(() => {
        window.clearTimeout(intentTimerRef.current);
        window.clearTimeout(commitTimerRef.current);
        window.clearTimeout(neutralTimerRef.current);
        intentTimerRef.current = undefined;
        commitTimerRef.current = undefined;
        neutralTimerRef.current = undefined;
        wheelIntentRef.current = createWheelIntentState();
        touchGestureRef.current = null;
        onWheelFeedbackChange(0, WHEEL_FEEDBACK_RESET_MS);
    }, [onWheelFeedbackChange]);

    // Clears pending timers and gesture state when the hook unmounts.
    useEffect(() => cancelPendingInput, [cancelPendingInput]);

    // Resets input state across phases and gates momentum after a completed transition.
    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        previousPhaseRef.current = phase;
        if (phase !== "idle") cancelPendingInput();
        else if (previousPhase !== "idle") {
            // A completed transition must observe a quiet interval before accepting momentum.
            wheelIntentRef.current = createWheelIntentState(true, performance.now());
        }
    }, [cancelPendingInput, phase]);

    // Converts unowned wheel input into deliberate adjacent-scene requests while idle.
    useEffect(() => {
        if (phase !== "idle") return;

        const scheduleNeutralRelease = () => {
            window.clearTimeout(neutralTimerRef.current);
            neutralTimerRef.current = window.setTimeout(() => {
                const released = releaseWheelNeutrality(wheelIntentRef.current, performance.now());
                wheelIntentRef.current = released;
                if (released.neutralRequired) scheduleNeutralRelease();
            }, WHEEL_INTENT_PAUSE_MS);
        };
        const scheduleIntentExpiry = () => {
            window.clearTimeout(intentTimerRef.current);
            intentTimerRef.current = window.setTimeout(() => {
                if (!wheelIntentRef.current.neutralRequired) {
                    wheelIntentRef.current = createWheelIntentState();
                    onWheelFeedbackChange(0, WHEEL_FEEDBACK_RETURN_MS);
                }
            }, WHEEL_INTENT_PAUSE_MS);
        };
        const handleWheel = (event: WheelEvent) => {
            if (event.defaultPrevented || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            const impulse = normalizeWheelDelta(event.deltaY, event.deltaMode);
            if (impulse === 0) return;
            const now = performance.now();
            const direction = impulse > 0 ? "forward" : "backward";
            if (firstScrollableOwner(inputScrollOwners(event.target, activeScrollerRef.current), direction)) {
                wheelIntentRef.current = createWheelIntentState(true, now);
                onWheelFeedbackChange(0, WHEEL_FEEDBACK_RETURN_MS);
                scheduleNeutralRelease();
                return;
            }
            event.preventDefault();
            if (wheelIntentRef.current.neutralRequired) {
                wheelIntentRef.current = applyWheelIntent(wheelIntentRef.current, impulse, now).state;
                scheduleNeutralRelease();
                return;
            }
            if (isTerminalSceneDirection(currentSceneId, direction)) {
                wheelIntentRef.current = createWheelIntentState();
                onWheelFeedbackChange(0, WHEEL_FEEDBACK_RETURN_MS);
                return;
            }
            const update = applyWheelIntent(wheelIntentRef.current, impulse, now);
            wheelIntentRef.current = update.state;
            if (!update.committedDirection) {
                onWheelFeedbackChange(update.state.accumulation / WHEEL_INTENT_THRESHOLD, WHEEL_FEEDBACK_EVENT_MS);
                scheduleIntentExpiry();
                return;
            }
            window.clearTimeout(intentTimerRef.current);
            const committedDirection = update.committedDirection;
            onWheelFeedbackChange(committedDirection === "forward" ? 1 : -1, WHEEL_FEEDBACK_EVENT_MS);
            commitTimerRef.current = window.setTimeout(() => {
                commitTimerRef.current = undefined;
                onWheelFeedbackChange(0, WHEEL_FEEDBACK_RESET_MS);
                requestScene({ kind: "adjacent", direction: committedDirection, source: "wheel" });
            }, WHEEL_FEEDBACK_EVENT_MS + WHEEL_FEEDBACK_HOLD_MS);
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        if (wheelIntentRef.current.neutralRequired) scheduleNeutralRelease();
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.clearTimeout(intentTimerRef.current);
            window.clearTimeout(commitTimerRef.current);
            window.clearTimeout(neutralTimerRef.current);
        };
    }, [activeScrollerRef, currentSceneId, onWheelFeedbackChange, phase, requestScene]);

    // Tracks one vertical touch gesture and commits its scene request on release.
    useEffect(() => {
        if (phase !== "idle") return;
        const handleTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1 || isInteractiveInputTarget(event.target)) {
                touchGestureRef.current = null;
                return;
            }
            const touch = event.touches[0];
            touchGestureRef.current = {
                axis: "pending", identifier: touch.identifier, progress: 0,
                scrollOwners: inputScrollOwners(event.target, activeScrollerRef.current),
                startX: touch.clientX, startY: touch.clientY,
            };
        };
        const handleTouchMove = (event: TouchEvent) => {
            const gesture = touchGestureRef.current;
            if (!gesture || event.touches.length !== 1) return;
            const touch = [...event.touches].find(({ identifier }) => identifier === gesture.identifier);
            if (!touch) return;
            const intent = gesture.axis === "vertical"
                ? { axis: "vertical" as const, progress: touchVerticalProgress(gesture.startY, touch.clientY) }
                : touchDragIntent(gesture.startX, gesture.startY, touch.clientX, touch.clientY);
            if (intent.axis === "pending") return;
            if (intent.axis === "horizontal") {
                touchGestureRef.current = null;
                return;
            }
            const direction = intent.progress >= 0 ? "forward" : "backward";
            if (gesture.axis === "pending" && intent.progress !== 0
                && firstScrollableOwner(gesture.scrollOwners, direction)) {
                touchGestureRef.current = null;
                return;
            }
            event.preventDefault();
            gesture.axis = "vertical";
            gesture.progress = intent.progress;
        };
        const handleTouchEnd = (event: TouchEvent) => {
            const gesture = touchGestureRef.current;
            if (!gesture || ![...event.changedTouches].some(({ identifier }) => identifier === gesture.identifier)) return;
            touchGestureRef.current = null;
            if (gesture.axis !== "vertical") return;
            const direction = releasedTouchDirection(gesture.progress);
            if (!direction || isTerminalSceneDirection(currentSceneId, direction)) return;
            requestScene({ kind: "adjacent", direction, source: "touch" });
        };
        const handleTouchCancel = () => { touchGestureRef.current = null; };
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
    }, [activeScrollerRef, currentSceneId, phase, requestScene]);

    // Gives scroll owners first keyboard priority, then requests adjacent scenes.
    useEffect(() => {
        if (phase !== "idle") return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat || isInteractiveInputTarget(event.target)) return;
            const direction = keyboardSceneDirection(event.key);
            if (!direction) return;
            const scrollOwner = firstScrollableOwner(inputScrollOwners(event.target, activeScrollerRef.current), direction);
            if (scrollOwner) {
                event.preventDefault();
                const distance = keyboardScrollDistance(event.key, scrollOwner.clientHeight);
                scrollOwner.scrollBy({ top: direction === "forward" ? distance : -distance, behavior: "auto" });
                return;
            }
            event.preventDefault();
            cancelPendingInput();
            requestScene({ kind: "adjacent", direction, source: "keyboard" });
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeScrollerRef, cancelPendingInput, phase, requestScene]);

    return { cancelPendingInput };
}

// Leaves native controls and Section-declared gesture owners in charge of their input.
function isInteractiveInputTarget(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return target.closest("a, button, input, textarea, select, option, [contenteditable]:not([contenteditable='false']), [role='button'], [role='slider'], [role='listbox']") !== null;
}

// Orders the target's nested viewport before the active Section viewport.
function inputScrollOwners(target: EventTarget | null, activeScroller: HTMLElement | null) {
    const nestedOwner = target instanceof Element ? target.closest<HTMLElement>("[data-scene-scroll-owner]") : null;
    return nestedOwner && nestedOwner !== activeScroller
        ? [nestedOwner, ...(activeScroller ? [activeScroller] : [])]
        : activeScroller ? [activeScroller] : [];
}

// Returns the first viewport that can still move in the requested direction.
function firstScrollableOwner(owners: readonly HTMLElement[], direction: SceneDirection) {
    const index = firstScrollableOwnerIndex(owners, direction);
    return index === null ? null : owners[index];
}
