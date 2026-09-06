export type GridCircle = {
    x: number;
    y: number;
    radius: number;
};

const SAMPLE_STEP = 24;
const WARP_FALLOFF = 200;
const WARP_STRENGTH = 52;

// Builds the vertical and horizontal SVG paths for the warped background grid.
export function createWarpedGridPaths(
    width: number,
    height: number,
    circle: GridCircle | null,
    spacing = 48,
) {
    const paths: string[] = [];

    for (let x = -spacing; x <= width + spacing; x += spacing) {
        paths.push(createLinePath(x, height, true, circle));
    }

    for (let y = -spacing; y <= height + spacing; y += spacing) {
        paths.push(createLinePath(y, width, false, circle));
    }

    return paths;
}

// Pushes one grid point away from the circle with a smooth distance falloff.
function warpPoint(x: number, y: number, circle: GridCircle | null) {
    if (!circle) return [x, y];

    const offsetX = x - circle.x;
    const offsetY = y - circle.y;
    const distance = Math.hypot(offsetX, offsetY);
    const influence = Math.min(1, Math.max(0, 1 - (distance - circle.radius) / WARP_FALLOFF));

    if (influence === 0 || distance === 0) return [x, y];

    const displacement = WARP_STRENGTH * influence * influence;
    return [
        x + (offsetX / distance) * displacement,
        y + (offsetY / distance) * displacement,
    ];
}

// Converts sampled points along one grid line into an SVG path.
function createLinePath(position: number, length: number, vertical: boolean, circle: GridCircle | null) {
    const points: string[] = [];

    for (let offset = -SAMPLE_STEP; offset <= length + SAMPLE_STEP; offset += SAMPLE_STEP) {
        const [x, y] = warpPoint(vertical ? position : offset, vertical ? offset : position, circle);
        points.push(`${points.length === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return points.join(" ");
}
