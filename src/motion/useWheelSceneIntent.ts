import { useCallback, useEffect, useRef, useState } from "react";
import type { ScenePhase, SceneRequest, SceneRequestResult } from "../types/scene";
import {
    applyWheelIntent,
    createWheelIntentState,
    normalizeWheelDelta,
    releaseWheelNeutrality,
    wheelIntentProgress,
    WHEEL_INTENT_PAUSE_MS,
    WHEEL_INTENT_THRESHOLD,
    type WheelIntentState,
} from "./wheelIntent";

type WheelSceneIntentOptions = {
    phase: ScenePhase;
    requestScene: (request: SceneRequest) => SceneRequestResult;
};

// Owns the page wheel listener and exposes one shared signed resistance value.
export function useWheelSceneIntent({ phase, requestScene }: WheelSceneIntentOptions) {
    const [resistanceProgress, setResistanceProgress] = useState(0);
    const intentRef = useRef(createWheelIntentState());
    const previousPhaseRef = useRef(phase);
    const returnFrameRef = useRef(0);
    const returnTimerRef = useRef<number | undefined>(undefined);
    const neutralTimerRef = useRef<number | undefined>(undefined);

    // Stops pending timers and animation frames before replacing intent state.
    const cancelScheduledWork = useCallback(() => {
        window.clearTimeout(returnTimerRef.current);
        window.clearTimeout(neutralTimerRef.current);
        cancelAnimationFrame(returnFrameRef.current);
        returnTimerRef.current = undefined;
        neutralTimerRef.current = undefined;
        returnFrameRef.current = 0;
    }, []);

    // Clears visible resistance so direct navigation can bypass the gate.
    const cancelResistance = useCallback(() => {
        cancelScheduledWork();
        intentRef.current = createWheelIntentState();
        setResistanceProgress(0);
    }, [cancelScheduledWork]);

    useEffect(() => {
        return cancelScheduledWork;
    }, [cancelScheduledWork]);

    useEffect(() => {
        const previousPhase = previousPhaseRef.current;
        previousPhaseRef.current = phase;
        if (phase !== "idle") {
            cancelScheduledWork();
            setResistanceProgress(0);
            return;
        }
        if (previousPhase === "idle") return;

        // A completed transition must observe a quiet interval before accepting momentum.
        intentRef.current = createWheelIntentState(true, performance.now());
    }, [cancelScheduledWork, phase]);

    useEffect(() => {
        if (phase !== "idle") return;

        // Rechecks neutrality from the most recent momentum event.
        const scheduleNeutralRelease = () => {
            window.clearTimeout(neutralTimerRef.current);
            neutralTimerRef.current = window.setTimeout(() => {
                const released = releaseWheelNeutrality(intentRef.current, performance.now());
                intentRef.current = released;
                if (released.neutralRequired) scheduleNeutralRelease();
            }, WHEEL_INTENT_PAUSE_MS);
        };

        // Animates an incomplete gesture back to rest from its pure timed state.
        const scheduleReturn = (state: WheelIntentState) => {
            window.clearTimeout(returnTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
            const delay = Math.max(0, (state.lastInputAt ?? performance.now())
                + WHEEL_INTENT_PAUSE_MS - performance.now());
            returnTimerRef.current = window.setTimeout(() => {
                const renderReturn = (now: number) => {
                    const progress = wheelIntentProgress(intentRef.current, now);
                    setResistanceProgress(progress);
                    if (progress === 0) {
                        intentRef.current = createWheelIntentState();
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
            event.preventDefault();
            const now = performance.now();

            if (intentRef.current.neutralRequired) {
                intentRef.current = applyWheelIntent(intentRef.current, impulse, now).state;
                scheduleNeutralRelease();
                return;
            }

            window.clearTimeout(returnTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
            const update = applyWheelIntent(intentRef.current, impulse, now);
            intentRef.current = update.state;

            if (!update.committedDirection) {
                setResistanceProgress(wheelIntentProgress(update.state, now));
                scheduleReturn(update.state);
                return;
            }

            setResistanceProgress(0);
            const result = requestScene({
                kind: "adjacent",
                direction: update.committedDirection,
                source: "wheel",
            });
            if (result.status === "accepted") return;

            // Boundary feedback uses the full pull until Slice 29 adds its smaller response.
            intentRef.current = {
                accumulation: update.committedDirection === "forward"
                    ? WHEEL_INTENT_THRESHOLD
                    : -WHEEL_INTENT_THRESHOLD,
                lastInputAt: now,
                neutralRequired: false,
            };
            setResistanceProgress(update.committedDirection === "forward" ? 1 : -1);
            scheduleReturn(intentRef.current);
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        if (intentRef.current.neutralRequired) scheduleNeutralRelease();
        return () => {
            window.removeEventListener("wheel", handleWheel);
            window.clearTimeout(returnTimerRef.current);
            window.clearTimeout(neutralTimerRef.current);
            cancelAnimationFrame(returnFrameRef.current);
        };
    }, [phase, requestScene]);

    return { cancelResistance, resistanceProgress };
}
