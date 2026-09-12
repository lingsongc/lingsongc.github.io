import { sceneOrder, type SceneDirection, type SceneId } from "../types/scene";

// Defines pure wheel, touch, keyboard, and scroll-boundary input calculations.
export const WHEEL_INTENT_THRESHOLD = 3;
export const WHEEL_INTENT_PAUSE_MS = 200;
export const TOUCH_INTENT_THRESHOLD_PX = 96;
export const TOUCH_AXIS_LOCK_PX = 8;

const PIXELS_PER_IMPULSE = 100;
const LINES_PER_IMPULSE = 3;

export type WheelIntentState = {
    accumulation: number;
    lastInputAt: number | null;
    neutralRequired: boolean;
};

export type ScrollBoundarySnapshot = {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
};

export function createWheelIntentState(
    neutralRequired = false,
    lastInputAt: number | null = null,
): WheelIntentState {
    return { accumulation: 0, lastInputAt, neutralRequired };
}

// Converts each WheelEvent delta mode to one bounded signed notch impulse.
export function normalizeWheelDelta(deltaY: number, deltaMode: number) {
    const impulse = deltaMode === 1
        ? deltaY / LINES_PER_IMPULSE
        : deltaMode === 2 ? deltaY : deltaY / PIXELS_PER_IMPULSE;
    return clamp(impulse, -1, 1);
}

// Accumulates deliberate wheel input, expiring incomplete intent after a quiet interval.
export function applyWheelIntent(state: WheelIntentState, impulse: number, now: number) {
    if (state.neutralRequired || impulse === 0) {
        return {
            committedDirection: null,
            state: state.neutralRequired ? noteWheelActivity(state, now) : state,
        };
    }

    const expired = state.lastInputAt !== null
        && now - state.lastInputAt >= WHEEL_INTENT_PAUSE_MS;
    const accumulation = clamp(
        (expired ? 0 : state.accumulation) + clamp(impulse, -1, 1),
        -WHEEL_INTENT_THRESHOLD,
        WHEEL_INTENT_THRESHOLD,
    );
    const committedDirection: SceneDirection | null = Math.abs(accumulation) >= WHEEL_INTENT_THRESHOLD
        ? accumulation > 0 ? "forward" : "backward"
        : null;

    return {
        committedDirection,
        state: committedDirection
            ? createWheelIntentState(true, now)
            : { accumulation, lastInputAt: now, neutralRequired: false },
    };
}

export function noteWheelActivity(state: WheelIntentState, now: number): WheelIntentState {
    return state.neutralRequired ? { ...state, lastInputAt: now } : state;
}

export function releaseWheelNeutrality(state: WheelIntentState, now: number): WheelIntentState {
    if (!state.neutralRequired || state.lastInputAt === null) return state;
    return now - state.lastInputAt >= WHEEL_INTENT_PAUSE_MS
        ? createWheelIntentState()
        : state;
}

// Resolves one drag axis and signed release progress without rendering drag feedback.
export function touchDragIntent(startX: number, startY: number, currentX: number, currentY: number) {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < TOUCH_AXIS_LOCK_PX) {
        return { axis: "pending" as const, progress: 0 };
    }
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        return { axis: "horizontal" as const, progress: 0 };
    }
    return { axis: "vertical" as const, progress: touchVerticalProgress(startY, currentY) };
}

export function touchVerticalProgress(startY: number, currentY: number) {
    return clamp((startY - currentY) / TOUCH_INTENT_THRESHOLD_PX, -1, 1);
}

export function releasedTouchDirection(progress: number): SceneDirection | null {
    if (Math.abs(progress) < 1) return null;
    return progress > 0 ? "forward" : "backward";
}

export function keyboardSceneDirection(key: string): SceneDirection | null {
    if (key === "ArrowDown" || key === "PageDown") return "forward";
    if (key === "ArrowUp" || key === "PageUp") return "backward";
    return null;
}

export function isTerminalSceneDirection(sceneId: SceneId, direction: SceneDirection) {
    const index = sceneOrder.indexOf(sceneId);
    return direction === "backward" ? index === 0 : index === sceneOrder.length - 1;
}

export function canScrollScene(
    { clientHeight, scrollHeight, scrollTop }: ScrollBoundarySnapshot,
    direction: SceneDirection,
) {
    if (scrollHeight <= clientHeight + 1) return false;
    return direction === "forward"
        ? scrollTop + clientHeight < scrollHeight - 1
        : scrollTop > 1;
}

export function firstScrollableOwnerIndex(
    owners: readonly ScrollBoundarySnapshot[],
    direction: SceneDirection,
) {
    const index = owners.findIndex((owner) => canScrollScene(owner, direction));
    return index === -1 ? null : index;
}

export function keyboardScrollDistance(key: string, clientHeight: number) {
    return key === "PageUp" || key === "PageDown" ? Math.max(1, clientHeight * 0.85) : 40;
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
