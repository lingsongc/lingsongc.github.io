export type ContactOffset = readonly [number, number];

// Calculates a Contact profile's final offset from the orbit center.
export function contactFinalOffset(offset: ContactOffset, orbitSize: number, axis: 0 | 1) {
    return offset[axis] * orbitSize;
}

// Places a profile circle inside the main circle along its movement direction.
export function contactInitialOffset(
    offset: ContactOffset,
    diameterRatio: number,
    orbitSize: number,
    axis: 0 | 1,
) {
    const directionLength = Math.hypot(...offset) || 1;
    const insetRadius = 0.5 - diameterRatio / 2 - 0.02;
    return offset[axis] / directionLength * insetRadius * orbitSize;
}
