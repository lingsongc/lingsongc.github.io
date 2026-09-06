export type MainCircleState = {
    width: number;
    top: number;
    left: number;
};

export type MainCircleHandoff = {
    start: number;
    end: number;
    from: MainCircleState;
    to: MainCircleState;
};

// Calculates the circle geometry for any scroll position across all section handoffs.
export function mainCircleStateAtScroll(
    scrollY: number,
    initialState: MainCircleState,
    handoffs: readonly MainCircleHandoff[],
    reducedMotion = false,
) {
    let currentState = initialState;

    for (const handoff of handoffs) {
        if (scrollY < handoff.start) break;
        if (scrollY >= handoff.end) {
            currentState = handoff.to;
            continue;
        }

        const progress = (scrollY - handoff.start) / (handoff.end - handoff.start);
        if (reducedMotion) return progress < 0.5 ? handoff.from : handoff.to;
        return interpolateMainCircleState(handoff.from, handoff.to, progress);
    }

    return currentState;
}

// Blends every circle measurement by the same handoff progress.
function interpolateMainCircleState(from: MainCircleState, to: MainCircleState, progress: number) {
    return {
        width: interpolateNumber(from.width, to.width, progress),
        top: interpolateNumber(from.top, to.top, progress),
        left: interpolateNumber(from.left, to.left, progress),
    };
}

// Blends one numeric measurement between its starting and ending values.
function interpolateNumber(from: number, to: number, progress: number) {
    return from + (to - from) * progress;
}
