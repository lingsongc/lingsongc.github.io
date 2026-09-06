const MOBILE_BREAKPOINT = 768;

// Calculates the About circle size for the current viewport.
export function aboutCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT ? viewportWidth * 0.95 : viewportHeight * 1.6;
}

// Calculates the Experience circle size for the current viewport.
export function experienceCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT
        ? viewportWidth * 0.78
        : Math.min(viewportWidth * 0.465, viewportHeight * 0.69);
}

// Calculates the Projects circle size for the current viewport.
export function projectCircleSize(viewportWidth: number, viewportHeight: number) {
    return viewportWidth <= MOBILE_BREAKPOINT
        ? viewportWidth * 0.576
        : Math.min(viewportWidth * 0.384, viewportHeight * 0.544);
}

// Calculates the Skills circle size from the viewport's shorter edge.
export function skillsCircleSize(viewportWidth: number, viewportHeight: number) {
    return Math.min(viewportWidth, viewportHeight) * 0.9;
}

// Positions the Skills circle before the navigation rail with an even outer gap.
export function skillsCircleLeft(viewportWidth: number, viewportHeight: number, railLeft: number) {
    const circleSize = skillsCircleSize(viewportWidth, viewportHeight);
    const circleGap = (viewportHeight - circleSize) / 2;
    return railLeft - circleGap - circleSize / 2;
}

// Calculates the Contact circle size from the viewport's shorter edge.
export function contactCircleSize(viewportWidth: number, viewportHeight: number) {
    return Math.min(viewportWidth, viewportHeight) * 0.56;
}
