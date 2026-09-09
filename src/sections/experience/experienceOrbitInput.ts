export const EXPERIENCE_WHEEL_RELEASE_MS = 200;

export type ExperienceWheelBoundaryState = {
    direction: -1 | 0 | 1;
    lastInputAt: number;
};

export type ExperienceWheelBoundaryUpdate = {
    consume: boolean;
    state: ExperienceWheelBoundaryState;
};

// Creates a selector boundary gate with no prior wheel ownership.
export function createExperienceWheelBoundaryState(): ExperienceWheelBoundaryState {
    return { direction: 0, lastInputAt: Number.NEGATIVE_INFINITY };
}

// Keeps one wheel gesture inside the selector, then releases a fresh boundary gesture.
export function updateExperienceWheelBoundary(
    state: ExperienceWheelBoundaryState,
    direction: -1 | 1,
    atBoundary: boolean,
    now: number,
): ExperienceWheelBoundaryUpdate {
    const sameGesture = state.direction === direction
        && now - state.lastInputAt < EXPERIENCE_WHEEL_RELEASE_MS;
    if (!atBoundary || sameGesture) {
        return {
            consume: true,
            state: { direction, lastInputAt: now },
        };
    }
    return {
        consume: false,
        state: createExperienceWheelBoundaryState(),
    };
}
