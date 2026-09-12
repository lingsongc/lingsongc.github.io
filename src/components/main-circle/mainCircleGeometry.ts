import type { MainCircleEndpoint } from "../../types/mainCircle";
import type { SceneId } from "../../types/scene";

const MOBILE_BREAKPOINT = 768;
export const MAIN_CIRCLE_TRAVEL_DURATION_MS = 1000;

export type MainCircleSceneLayout = {
    viewportWidth: number;
    viewportHeight: number;
    homeCircleWidth: number;
    experienceCenter: { top: number; left: number };
    navigationRailLeft: number;
};

// Mirrors the CSS clamp used for the Home circle at the current root font size.
export function homeCircleSize(viewportWidth: number, rootFontSize: number) {
    return Math.min(Math.max(rootFontSize * 8, viewportWidth * 0.28), rootFontSize * 22);
}

export function aboutCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT ? viewportWidth * 0.95 : viewportHeight * 1.6;
}

export function aboutCircleLeft(viewportWidth: number, viewportHeight: number) {
    return aboutCircleSize(viewportWidth, viewportHeight) * (viewportWidth <= MOBILE_BREAKPOINT ? -0.2 : -0.1);
}

export function experienceCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT
        ? viewportWidth * 0.78
        : Math.min(viewportWidth * 0.465, viewportHeight * 0.69);
}

export function projectCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT
        ? viewportWidth * 0.576
        : Math.min(viewportWidth * 0.384, viewportHeight * 0.544);
}

export function skillsCircleSize(viewportWidth: number, viewportHeight: number) {
    return Math.min(viewportWidth, viewportHeight) * 0.9;
}

export function skillsCircleLeft(viewportWidth: number, viewportHeight: number, railLeft: number) {
    const circleSize = skillsCircleSize(viewportWidth, viewportHeight);
    return railLeft - (viewportHeight - circleSize) / 2 - circleSize / 2;
}

export function contactCircleSize(viewportWidth: number, viewportHeight: number) {
    return Math.min(viewportWidth, viewportHeight) * 0.56;
}

// Resolves one scene endpoint from the current viewport and measured layout snapshot.
export function resolveMainCircleSceneEndpoint(sceneId: SceneId, layout: MainCircleSceneLayout): MainCircleEndpoint {
    const { viewportWidth, viewportHeight } = layout;
    switch (sceneId) {
        case "home":
            return { width: layout.homeCircleWidth, top: viewportHeight / 2, left: viewportWidth / 2 };
        case "about":
            return { width: aboutCircleSize(viewportWidth, viewportHeight), top: viewportHeight / 2, left: aboutCircleLeft(viewportWidth, viewportHeight) };
        case "experience":
            return { width: experienceCircleSize(viewportWidth, viewportHeight), ...layout.experienceCenter };
        case "projects":
            return { width: projectCircleSize(viewportWidth, viewportHeight), top: viewportHeight / 2, left: viewportWidth / 2 };
        case "skills":
            return { width: skillsCircleSize(viewportWidth, viewportHeight), top: viewportHeight / 2, left: skillsCircleLeft(viewportWidth, viewportHeight, layout.navigationRailLeft) };
        case "contact":
            return { width: contactCircleSize(viewportWidth, viewportHeight), top: viewportHeight / 2, left: viewportWidth / 2 };
        default:
            return assertNever(sceneId);
    }
}

// Interpolates direct circle geometry and shared eased progress at one elapsed time.
export function mainCircleTravelAtTime(
    from: MainCircleEndpoint,
    to: MainCircleEndpoint,
    elapsedMs: number,
    ease: (progress: number) => number = linearEase,
) {
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

function linearEase(progress: number) { return progress; }
function interpolateNumber(from: number, to: number, progress: number) { return from + (to - from) * progress; }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(Math.max(value, minimum), maximum); }
function assertNever(value: never): never { throw new Error(`Unknown scene: ${String(value)}`); }
