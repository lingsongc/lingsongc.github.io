import type { MainCircleEndpoint } from "../types/mainCircle";

export const MAIN_CIRCLE_TRAVEL_DURATION_MS = 1000;

export type MainCircleTravelEase = (progress: number) => number;

export type MainCircleTravelSnapshot = {
    endpoint: MainCircleEndpoint;
    easedProgress: number;
};

// Resolves direct circle geometry and shared eased progress at one elapsed time.
export function mainCircleTravelAtTime(
    from: MainCircleEndpoint,
    to: MainCircleEndpoint,
    elapsedMs: number,
    ease: MainCircleTravelEase = linearEase,
): MainCircleTravelSnapshot {
    const normalizedProgress = clamp(elapsedMs / MAIN_CIRCLE_TRAVEL_DURATION_MS, 0, 1);
    const easedProgress = clamp(ease(normalizedProgress), 0, 1);

    return {
        endpoint: {
            width: interpolateNumber(from.width, to.width, easedProgress),
            top: interpolateNumber(from.top, to.top, easedProgress),
            left: interpolateNumber(from.left, to.left, easedProgress),
        },
        easedProgress,
    };
}

// Provides an explicit default while allowing the final ease to remain configurable.
function linearEase(progress: number) {
    return progress;
}

// Blends one measurement with the same progress used by every circle property.
function interpolateNumber(from: number, to: number, progress: number) {
    return from + (to - from) * progress;
}

// Keeps elapsed time and injected easing output within endpoint bounds.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
