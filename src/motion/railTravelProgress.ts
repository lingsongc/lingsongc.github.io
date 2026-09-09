import { sceneOrder, type SceneId } from "../types/scene";

export type TransientRailMarker = {
    sceneId: SceneId;
    progress: number;
};

// Calculates visual-only intermediate marker fills in direct travel order.
export function transientRailMarkerProgress(
    fromSceneId: SceneId,
    toSceneId: SceneId,
    easedProgress: number,
): readonly TransientRailMarker[] {
    const fromIndex = sceneOrder.indexOf(fromSceneId);
    const toIndex = sceneOrder.indexOf(toSceneId);
    const distance = Math.abs(toIndex - fromIndex);
    if (distance <= 1) return [];

    const direction = toIndex > fromIndex ? 1 : -1;
    const clampedProgress = clamp(easedProgress, 0, 1);

    return Array.from({ length: distance - 1 }, (_, index) => {
        const ordinal = index + 1;
        const sceneId = sceneOrder[fromIndex + ordinal * direction];
        const markerPeak = ordinal / distance;
        const markerProgress = 1 - Math.abs(clampedProgress - markerPeak) * distance;

        return {
            sceneId,
            progress: clamp(markerProgress, 0, 1),
        };
    });
}

// Keeps marker fills within their visual zero-to-one range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
