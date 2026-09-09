export type ContactOffset = readonly [number, number];

// Calculates a Contact profile's final offset from the orbit center.
export function contactFinalOffset(offset: ContactOffset, orbitSize: number, axis: 0 | 1) {
    return offset[axis] * orbitSize;
}

// Keeps a final profile circle inside the current viewport without changing its direction.
export function contactFittedFinalOffset(
    offset: ContactOffset,
    diameterRatio: number,
    orbitSize: number,
    viewportWidth: number,
    viewportHeight: number,
    axis: 0 | 1,
) {
    const requestedOffset = contactFinalOffset(offset, orbitSize, axis);
    const viewportSize = axis === 0 ? viewportWidth : viewportHeight;
    const availableOffset = Math.max(0, viewportSize / 2 - diameterRatio * orbitSize / 2 - 4);
    return Math.min(Math.max(requestedOffset, -availableOffset), availableOffset);
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
