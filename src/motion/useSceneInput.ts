import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { SceneDirection, SceneId, ScenePhase, SceneRequest, SceneRequestResult } from "../types/scene";
import {
    applyWheelIntent, createWheelIntentState, firstScrollableOwnerIndex,
    isTerminalSceneDirection, keyboardSceneDirection, keyboardScrollDistance,
    normalizeWheelDelta, releaseWheelNeutrality, releasedTouchDirection,
    touchDragIntent, touchVerticalProgress, WHEEL_INTENT_PAUSE_MS,
} from "./sceneInputModel";

type SceneInputOptions = {
    activeScrollerRef: RefObject<HTMLDivElement | null>;
    currentSceneId: SceneId;
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
export function useSceneInput({ activeScrollerRef, currentSceneId, phase, requestScene }: SceneInputOptions) {
    const wheelIntentRef = useRef(createWheelIntentState());
    const touchGestureRef = useRef<TouchGesture | null>(null);
    const previousPhaseRef = useRef(phase);
    const intentTimerRef = useRef<number | undefined>(undefined);
    const neutralTimerRef = useRef<number | undefined>(undefined);

    // Cancels accumulated browser-event state before a direct request or phase change.
    const cancelPendingInput = useCallback(() => {
        window.clearTimeout(intentTimerRef.current);
        window.clearTimeout(neutralTimerRef.current);
        intentTimerRef.current = undefined;
        neutralTimerRef.current = undefined;
        wheelIntentRef.current = createWheelIntentState();
        touchGestureRef.current = null;
    }, []);

    useEffect(() => cancelPendingInput, [cancelPendingInput]);

    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        previousPhaseRef.current = phase;
        if (phase !== "idle") cancelPendingInput();
        else if (previousPhase !== "idle") {
            // A completed transition must observe a quiet interval before accepting momentum.
            wheelIntentRef.current = createWheelIntentState(true, performance.now());
        }
    }, [cancelPendingInput, phase]);

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
                if (!wheelIntentRef.current.neutralRequired) wheelIntentRef.current = createWheelIntentState();
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
                return;
            }
            const update = applyWheelIntent(wheelIntentRef.current, impulse, now);
            wheelIntentRef.current = update.state;
            if (!update.committedDirection) {
                scheduleIntentExpiry();
                return;
            }
            window.clearTimeout(intentTimerRef.current);
            requestScene({ kind: "adjacent", direction: update.committedDirection, source: "wheel" });
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        if (wheelIntentRef.current.neutralRequired) scheduleNeutralRelease();
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.clearTimeout(intentTimerRef.current);
            window.clearTimeout(neutralTimerRef.current);
        };
    }, [activeScrollerRef, currentSceneId, phase, requestScene]);

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
