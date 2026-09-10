import { sceneOrder, type SceneDirection, type SceneId } from "../types/scene";

// Defines pure touch, keyboard, return, and terminal-edge input calculations.
export const TOUCH_INTENT_THRESHOLD_PX = 96;
export const TOUCH_AXIS_LOCK_PX = 8;
export const HARD_EDGE_PROGRESS = 0.35;

export type TouchDragIntent = {
    axis: "horizontal" | "pending" | "vertical";
    progress: number;
};

export type ScrollBoundarySnapshot = {
    clientHeight: number;
    scrollHeight: number;
    scrollTop: number;
};

// Resolves one drag axis and signed progress without depending on event frequency.
export function touchDragIntent(
    startX: number,
    startY: number,
    currentX: number,
    currentY: number,
): TouchDragIntent {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < TOUCH_AXIS_LOCK_PX) {
        return { axis: "pending", progress: 0 };
    }
    if (Math.abs(deltaX) >= Math.abs(deltaY)) {
        return { axis: "horizontal", progress: 0 };
    }
    return {
        axis: "vertical",
        progress: touchVerticalProgress(startY, currentY),
    };
}

// Keeps a previously locked vertical gesture responsive when it crosses its origin.
export function touchVerticalProgress(startY: number, currentY: number) {
    return clamp((startY - currentY) / TOUCH_INTENT_THRESHOLD_PX, -1, 1);
}

// Commits touch intent only when release occurs at the deliberate threshold.
export function releasedTouchDirection(progress: number): SceneDirection | null {
    if (Math.abs(progress) < 1) return null;
    return progress > 0 ? "forward" : "backward";
}

// Maps supported navigation keys to one predictable adjacent direction.
export function keyboardSceneDirection(key: string): SceneDirection | null {
    if (key === "ArrowDown" || key === "PageDown") return "forward";
    if (key === "ArrowUp" || key === "PageUp") return "backward";
    return null;
}

// Identifies the two directions where no adjacent Section exists.
export function isTerminalSceneDirection(sceneId: SceneId, direction: SceneDirection) {
    const index = sceneOrder.indexOf(sceneId);
    return direction === "backward" ? index === 0 : index === sceneOrder.length - 1;
}

// Reports whether native vertical scrolling can still consume this direction.
export function canScrollScene(
    { clientHeight, scrollHeight, scrollTop }: ScrollBoundarySnapshot,
    direction: SceneDirection,
) {
    if (scrollHeight <= clientHeight + 1) return false;
    return direction === "forward"
        ? scrollTop + clientHeight < scrollHeight - 1
        : scrollTop > 1;
}

// Selects the highest-priority owned viewport that can consume the direction.
export function firstScrollableOwnerIndex(
    owners: readonly ScrollBoundarySnapshot[],
    direction: SceneDirection,
) {
    const index = owners.findIndex((owner) => canScrollScene(owner, direction));
    return index === -1 ? null : index;
}

// Gives Arrow and Page keys a predictable native-scale local scroll distance.
export function keyboardScrollDistance(key: string, clientHeight: number) {
    return key === "PageUp" || key === "PageDown"
        ? Math.max(1, clientHeight * 0.85)
        : 40;
}

// Produces a smaller signed response that cannot accumulate beyond the hard edge.
export function hardEdgeResistance(direction: SceneDirection, magnitude = 1) {
    const sign = direction === "forward" ? 1 : -1;
    return sign * HARD_EDGE_PROGRESS * clamp(Math.abs(magnitude), 0, 1);
}

// Returns any signed resistance smoothly to zero without bounce or overshoot.
export function returningResistance(initialProgress: number, elapsed: number, duration: number) {
    if (duration <= 0) return 0;
    const time = clamp(elapsed / duration, 0, 1);
    const eased = time * time * (3 - 2 * time);
    return initialProgress * (1 - eased);
}

// Keeps progress values within their declared range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
