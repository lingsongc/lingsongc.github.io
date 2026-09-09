export type GridCircle = {
    x: number;
    y: number;
    radius: number;
};

export type GridResistance = {
    height: number;
    progress: number;
    width: number;
};

const SAMPLE_STEP = 24;
const WARP_FALLOFF = 200;
const WARP_STRENGTH = 52;
const TRIANGULAR_WARP_STRENGTH = 32;
const TOTAL_WARP_CAP = 64;
const TRIANGULAR_REACH_RATIO = 0.65;
const TRIANGULAR_START_HALF_WIDTH = 48;
const TRIANGULAR_EXPANSION = 0.75;

// Builds the vertical and horizontal SVG paths for the warped background grid.
export function createWarpedGridPaths(
    width: number,
    height: number,
    circle: GridCircle | null,
    spacing = 48,
    resistanceProgress = 0,
) {
    const paths: string[] = [];
    const resistance = { width, height, progress: resistanceProgress };

    for (let x = -spacing; x <= width + spacing; x += spacing) {
        paths.push(createLinePath(x, height, true, circle, resistance));
    }

    for (let y = -spacing; y <= height + spacing; y += spacing) {
        paths.push(createLinePath(y, width, false, circle, resistance));
    }

    return paths;
}

// Combines circular and triangular displacement under one safe vector cap.
export function warpGridPoint(
    x: number,
    y: number,
    circle: GridCircle | null,
    resistance: GridResistance | null = null,
) {
    const [circleX, circleY] = circleWarpDisplacement(x, y, circle);
    const [triangleX, triangleY] = resistance
        ? triangularGridDisplacement(x, y, resistance)
        : [0, 0];
    const displacementX = circleX + triangleX;
    const displacementY = circleY + triangleY;
    const magnitude = Math.hypot(displacementX, displacementY);
    const capScale = magnitude > TOTAL_WARP_CAP ? TOTAL_WARP_CAP / magnitude : 1;

    return [
        x + displacementX * capScale,
        y + displacementY * capScale,
    ];
}

// Creates the signed soft triangular lift from the active viewport edge.
export function triangularGridDisplacement(
    x: number,
    y: number,
    { width, height, progress }: GridResistance,
) {
    const signedProgress = clamp(progress, -1, 1);
    if (signedProgress === 0 || width <= 0 || height <= 0) return [0, 0];

    const forward = signedProgress > 0;
    const distanceFromEdge = forward ? height - y : y;
    const reach = height * TRIANGULAR_REACH_RATIO;
    if (distanceFromEdge < 0 || distanceFromEdge >= reach) return [0, 0];

    const halfWidth = TRIANGULAR_START_HALF_WIDTH
        + distanceFromEdge * TRIANGULAR_EXPANSION;
    const horizontalDistance = Math.abs(x - width / 2);
    if (horizontalDistance >= halfWidth) return [0, 0];

    const verticalInfluence = smoothstep(1 - distanceFromEdge / reach);
    const horizontalInfluence = smoothstep(1 - horizontalDistance / halfWidth);
    const displacement = TRIANGULAR_WARP_STRENGTH
        * Math.abs(signedProgress)
        * verticalInfluence
        * horizontalInfluence;
    return [0, forward ? -displacement : displacement];
}

// Pushes one grid point away from the circle with a smooth distance falloff.
function circleWarpDisplacement(x: number, y: number, circle: GridCircle | null) {
    if (!circle) return [0, 0];

    const offsetX = x - circle.x;
    const offsetY = y - circle.y;
    const distance = Math.hypot(offsetX, offsetY);
    const influence = Math.min(1, Math.max(0, 1 - (distance - circle.radius) / WARP_FALLOFF));

    if (influence === 0 || distance === 0) return [0, 0];

    const displacement = WARP_STRENGTH * influence * influence;
    return [
        (offsetX / distance) * displacement,
        (offsetY / distance) * displacement,
    ];
}

// Converts sampled points along one grid line into an SVG path.
function createLinePath(
    position: number,
    length: number,
    vertical: boolean,
    circle: GridCircle | null,
    resistance: GridResistance,
) {
    const points: string[] = [];

    for (let offset = -SAMPLE_STEP; offset <= length + SAMPLE_STEP; offset += SAMPLE_STEP) {
        const [x, y] = warpGridPoint(
            vertical ? position : offset,
            vertical ? offset : position,
            circle,
            resistance,
        );
        points.push(`${points.length === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return points.join(" ");
}

// Softens a normalized influence while preserving exact endpoints.
function smoothstep(value: number) {
    const normalized = clamp(value, 0, 1);
    return normalized * normalized * (3 - 2 * normalized);
}

// Keeps progress and influence values within their declared range.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
