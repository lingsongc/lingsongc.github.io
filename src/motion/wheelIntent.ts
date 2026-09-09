import type { SceneDirection } from "../types/scene";

// Defines deterministic wheel normalization, accumulation, and return calculations.
export const WHEEL_INTENT_THRESHOLD = 3;
export const WHEEL_INTENT_PAUSE_MS = 200;
export const WHEEL_INTENT_RETURN_MS = 300;
export const WHEEL_COMPOSITION_PULL_PX = 24;

const PIXELS_PER_IMPULSE = 100;
const LINES_PER_IMPULSE = 3;

export type WheelIntentState = {
    accumulation: number;
    lastInputAt: number | null;
    neutralRequired: boolean;
};

export type WheelIntentUpdate = {
    committedDirection: SceneDirection | null;
    state: WheelIntentState;
};

// Creates a resting gate, optionally blocking input until wheel activity pauses.
export function createWheelIntentState(
    neutralRequired = false,
    lastInputAt: number | null = null,
): WheelIntentState {
    return { accumulation: 0, lastInputAt, neutralRequired };
}

// Converts each WheelEvent delta mode to one bounded signed notch impulse.
export function normalizeWheelDelta(
    deltaY: number,
    deltaMode: number,
) {
    const impulse = deltaMode === 1
        ? deltaY / LINES_PER_IMPULSE
        : deltaMode === 2
            ? deltaY
            : deltaY / PIXELS_PER_IMPULSE;
    return clamp(impulse, -1, 1);
}

// Applies one impulse after materializing any return already in progress.
export function applyWheelIntent(
    state: WheelIntentState,
    impulse: number,
    now: number,
): WheelIntentUpdate {
    if (state.neutralRequired || impulse === 0) {
        return {
            committedDirection: null,
            state: state.neutralRequired ? noteWheelActivity(state, now) : state,
        };
    }

    const currentAccumulation = wheelIntentProgress(state, now) * WHEEL_INTENT_THRESHOLD;
    const accumulation = clamp(
        currentAccumulation + clamp(impulse, -1, 1),
        -WHEEL_INTENT_THRESHOLD,
        WHEEL_INTENT_THRESHOLD,
    );
    const committedDirection = Math.abs(accumulation) >= WHEEL_INTENT_THRESHOLD
        ? accumulation > 0 ? "forward" : "backward"
        : null;

    return {
        committedDirection,
        state: committedDirection
            ? createWheelIntentState(true, now)
            : { accumulation, lastInputAt: now, neutralRequired: false },
    };
}

// Returns signed resistance after its pause and monotonic no-overshoot decay.
export function wheelIntentProgress(state: WheelIntentState, now: number) {
    if (state.neutralRequired || state.accumulation === 0) return 0;
    if (state.lastInputAt === null) return state.accumulation / WHEEL_INTENT_THRESHOLD;

    const returnProgress = clamp(
        (now - state.lastInputAt - WHEEL_INTENT_PAUSE_MS) / WHEEL_INTENT_RETURN_MS,
        0,
        1,
    );
    const smoothReturn = returnProgress * returnProgress * (3 - 2 * returnProgress);
    return state.accumulation / WHEEL_INTENT_THRESHOLD * (1 - smoothReturn);
}

// Maps forward intent upward and backward intent downward within the pull cap.
export function wheelCompositionOffset(progress: number) {
    return clamp(progress, -1, 1) * -WHEEL_COMPOSITION_PULL_PX;
}

// Records momentum while the gate waits for a genuinely neutral interval.
export function noteWheelActivity(state: WheelIntentState, now: number): WheelIntentState {
    return state.neutralRequired ? { ...state, lastInputAt: now } : state;
}

// Releases the post-transition gate only after the configured quiet interval.
export function releaseWheelNeutrality(state: WheelIntentState, now: number): WheelIntentState {
    if (!state.neutralRequired || state.lastInputAt === null) return state;
    return now - state.lastInputAt >= WHEEL_INTENT_PAUSE_MS
        ? createWheelIntentState()
        : state;
}

// Keeps all normalized values inside their declared range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
