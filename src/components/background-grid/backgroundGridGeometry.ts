export type GridCircle = {
    x: number;
    y: number;
    radius: number;
};

export type GridScrollFeedback = {
    height: number;
    progress: number;
    width: number;
};

export type ScrollTearRevealPaths = {
    fill: string;
    leftSeam: string;
    rightSeam: string;
};

type ScrollTearPoint = {
    direction: number;
    easedProgress: number;
    elasticStretch: number;
    horizontalInfluence: number;
    influence: number;
    triangleHalfWidth: number;
    verticalInfluence: number;
};

const SAMPLE_STEP = 24;
const WARP_FALLOFF = 200;
const WARP_STRENGTH = 52;
const GRID_FOLD_STRENGTH = 120;
const GRID_RIPPLE_STRENGTH = 60;
const GRID_NOISE_STRENGTH = 40;
const GRID_CRUMPLE_LIMIT_RATIO = 2;
const REVEAL_FOLD_WEIGHT = 0.2;
const REVEAL_NOISE_WEIGHT = 0.8;
const REVEAL_CRUMPLE_RATIO = 0.2;
const SCROLL_NOISE_SEED = 1;
const SCROLL_TEAR_HEIGHT_RATIO = 0.15;
const TEAR_HALF_BASE_RATIO = 1 / Math.sqrt(3);
const TEAR_SIDE_CONCAVITY_EXPONENT = 3;
const MAX_ELASTIC_STRETCH = 0.04;
const TEAR_REVEAL_SAMPLE_STEP = 8;

// Builds the vertical and horizontal SVG paths for the warped background grid.
export function createWarpedGridPaths(
    width: number,
    height: number,
    circle: GridCircle | null,
    spacing = 48,
    scrollProgress = 0,
) {
    const paths: string[] = [];
    const scrollFeedback = { height, progress: scrollProgress, width };

    for (let x = -spacing; x <= width + spacing; x += spacing) {
        paths.push(createLinePath(x, height, true, circle, scrollFeedback));
    }

    for (let y = -spacing; y <= height + spacing; y += spacing) {
        paths.push(createLinePath(y, width, false, circle, scrollFeedback));
    }

    return paths;
}

// Builds the fill and independent side seams needed for the tear's edge-only opacity mask.
export function createScrollTearRevealPaths(
    width: number,
    height: number,
    scrollProgress: number,
): ScrollTearRevealPaths {
    if (scrollProgress === 0 || width <= 0 || height <= 0) {
        return { fill: "", leftSeam: "", rightSeam: "" };
    }

    const feedback = { height, progress: scrollProgress, width };
    const visualProgress = easeOutScrollProgress(Math.min(1, Math.abs(scrollProgress)));
    const tearHeight = height * SCROLL_TEAR_HEIGHT_RATIO * visualProgress;
    const edgeY = scrollProgress > 0 ? height : 0;
    const tipY = scrollProgress > 0 ? height - tearHeight : tearHeight;
    const sampleCount = Math.max(1, Math.ceil(tearHeight / TEAR_REVEAL_SAMPLE_STEP));
    const centerX = width / 2;
    const leftEdge: string[] = [];
    const rightEdge: string[] = [];

    for (let index = 0; index <= sampleCount; index += 1) {
        const progress = index / sampleCount;
        const y = tipY + (edgeY - tipY) * progress;
        const leftX = centerX + scrollRevealDisplacementX(centerX - 0.01, y, feedback);
        const rightX = centerX + scrollRevealDisplacementX(centerX, y, feedback);
        leftEdge.push(`${leftX.toFixed(1)} ${y.toFixed(1)}`);
        rightEdge.push(`${rightX.toFixed(1)} ${y.toFixed(1)}`);
    }

    return {
        fill: `M${leftEdge.join(" L")} L${[...rightEdge].reverse().join(" L")} Z`,
        leftSeam: `M${leftEdge.join(" L")}`,
        rightSeam: `M${rightEdge.join(" L")}`,
    };
}
// Applies the persistent circle's radial lensing to one grid point.
export function warpGridPoint(
    x: number,
    y: number,
    circle: GridCircle | null,
    scrollFeedback: GridScrollFeedback | null = null,
) {
    const [displacementX, displacementY] = circleWarpDisplacement(x, y, circle);
    return [
        x + displacementX + scrollFeedbackDisplacementX(x, y, scrollFeedback),
        y + displacementY,
    ];
}

// Applies the aggressive but locally bounded crumple used only by the background grid.
export function scrollFeedbackDisplacementX(
    x: number,
    y: number,
    feedback: GridScrollFeedback | null,
) {
    const point = createScrollTearPoint(x, y, feedback);
    if (!point) return 0;

    const sideSeed = SCROLL_NOISE_SEED + (point.direction < 0 ? 0 : 31);
    const fold = (Math.abs(Math.sin(y * 0.08 + x * 0.05)) - 0.5) * GRID_FOLD_STRENGTH;
    const ripple = Math.sin(y * 0.2 + x * 0.1) * GRID_RIPPLE_STRENGTH;
    const noise = smoothNoise(point.verticalInfluence * 8 + x / 120, sideSeed) * GRID_NOISE_STRENGTH;
    const crumpleLimit = point.triangleHalfWidth * GRID_CRUMPLE_LIMIT_RATIO;
    const crumple = clamp(fold + ripple + noise, -crumpleLimit, crumpleLimit)
        * point.influence
        * point.easedProgress
        * point.elasticStretch;
    return tearOpeningX(point) + crumple;
}

// Keeps the red reveal close to its concave silhouette independently of the grid crumple.
export function scrollRevealDisplacementX(
    x: number,
    y: number,
    feedback: GridScrollFeedback | null,
) {
    const point = createScrollTearPoint(x, y, feedback);
    if (!point) return 0;

    const sideSeed = SCROLL_NOISE_SEED + (point.direction < 0 ? 7 : 43);
    const fold = Math.sin(point.verticalInfluence * Math.PI * 5 + sideSeed);
    const noise = smoothNoise(point.verticalInfluence * 7, sideSeed + 11);
    const crumplePattern = fold * REVEAL_FOLD_WEIGHT + noise * REVEAL_NOISE_WEIGHT;
    const crumple = crumplePattern
        * point.triangleHalfWidth
        * REVEAL_CRUMPLE_RATIO
        * point.influence
        * point.easedProgress
        * point.elasticStretch;
    return tearOpeningX(point) + crumple;
}

// Front-loads visual growth without changing the linear logical wheel threshold.
export function easeOutScrollProgress(progress: number) {
    const boundedProgress = clamp(progress, 0, 1);
    return 1 - Math.pow(1 - boundedProgress, 2);
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

// Resolves the shared concave envelope while leaving each visual layer free to style it.
function createScrollTearPoint(
    x: number,
    y: number,
    feedback: GridScrollFeedback | null,
): ScrollTearPoint | null {
    if (!feedback || feedback.progress === 0 || feedback.width <= 0 || feedback.height <= 0) return null;

    const rawProgress = Math.abs(feedback.progress);
    const easedProgress = easeOutScrollProgress(Math.min(1, rawProgress));
    const elasticStretch = 1 + clamp(rawProgress - 1, 0, MAX_ELASTIC_STRETCH);
    const edgeDistance = feedback.progress > 0 ? feedback.height - y : y;
    const tearHeight = feedback.height * SCROLL_TEAR_HEIGHT_RATIO * easedProgress;
    const depthInsideTear = clamp(tearHeight - edgeDistance, 0, tearHeight);
    if (depthInsideTear === 0) return null;

    const verticalInfluence = depthInsideTear / tearHeight;
    const triangleHalfWidth = tearHeight
        * TEAR_HALF_BASE_RATIO
        * Math.pow(verticalInfluence, TEAR_SIDE_CONCAVITY_EXPONENT);
    const horizontalInfluence = clamp(
        1 - Math.abs(x - feedback.width / 2) / triangleHalfWidth,
        0,
        1,
    );
    const influence = verticalInfluence * horizontalInfluence;
    if (influence === 0) return null;

    return {
        direction: x < feedback.width / 2 ? -1 : 1,
        easedProgress,
        elasticStretch,
        horizontalInfluence,
        influence,
        triangleHalfWidth,
        verticalInfluence,
    };
}

// Opens either layer inside the shared concave envelope.
function tearOpeningX(point: ScrollTearPoint) {
    return point.direction
        * point.triangleHalfWidth
        * Math.pow(point.horizontalInfluence, 1.35)
        * point.elasticStretch;
}

// Produces stable interpolated noise so the tear stays irregular without flickering between frames.
function smoothNoise(position: number, seed: number) {
    const lowerIndex = Math.floor(position);
    const blend = position - lowerIndex;
    const easedBlend = blend * blend * (3 - 2 * blend);
    const lowerValue = noiseValue(lowerIndex, seed);
    const upperValue = noiseValue(lowerIndex + 1, seed);
    return lowerValue + (upperValue - lowerValue) * easedBlend;
}

// Maps one integer sample and seed to a repeatable value between negative and positive one.
function noiseValue(index: number, seed: number) {
    const value = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
    return (value - Math.floor(value)) * 2 - 1;
}

// Converts sampled points along one grid line into an SVG path.
function createLinePath(
    position: number,
    length: number,
    vertical: boolean,
    circle: GridCircle | null,
    scrollFeedback: GridScrollFeedback,
) {
    const points: string[] = [];
    const centerX = scrollFeedback.width / 2;

    for (let offset = -SAMPLE_STEP; offset <= length + SAMPLE_STEP; offset += SAMPLE_STEP) {
        const sourceX = vertical ? position : offset;
        const sourceY = vertical ? offset : position;
        const [x, y] = warpGridPoint(
            sourceX,
            sourceY,
            circle,
            scrollFeedback,
        );
        const crossesActiveSeam = !vertical
            && offset >= centerX
            && offset - SAMPLE_STEP < centerX
            && scrollFeedbackDisplacementX(centerX, sourceY, scrollFeedback) !== 0;
        points.push(`${points.length === 0 || crossesActiveSeam ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return points.join(" ");
}

// Bounds a geometry factor without changing its easing curve.
function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
