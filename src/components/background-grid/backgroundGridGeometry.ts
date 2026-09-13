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

const SAMPLE_STEP = 24;
const WARP_FALLOFF = 200;
const WARP_STRENGTH = 52;
const SCROLL_FOLD_STRENGTH = 100;
const SCROLL_RIPPLE_STRENGTH = 50;
const SCROLL_TEAR_HEIGHT_RATIO = 0.15;
const TEAR_HALF_BASE_RATIO = 1 / Math.sqrt(3);
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
        const leftX = centerX + scrollFeedbackDisplacementX(centerX - 0.01, y, feedback);
        const rightX = centerX + scrollFeedbackDisplacementX(centerX, y, feedback);
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

// Opens a restrained triangular edge seam without changing any point's vertical position.
export function scrollFeedbackDisplacementX(
    x: number,
    y: number,
    feedback: GridScrollFeedback | null,
) {
    if (!feedback || feedback.progress === 0 || feedback.width <= 0 || feedback.height <= 0) return 0;

    const rawProgress = Math.abs(feedback.progress);
    const progress = Math.min(1, rawProgress);
    const easedProgress = easeOutScrollProgress(progress);
    const elasticStretch = 1 + clamp(rawProgress - 1, 0, MAX_ELASTIC_STRETCH);
    const edgeDistance = feedback.progress > 0 ? feedback.height - y : y;
    const tearHeight = feedback.height * SCROLL_TEAR_HEIGHT_RATIO * easedProgress;
    const depthInsideTear = clamp(tearHeight - edgeDistance, 0, tearHeight);
    if (depthInsideTear === 0) return 0;

    const verticalInfluence = depthInsideTear / tearHeight;
    const centerX = feedback.width / 2;
    const triangleHalfWidth = depthInsideTear * TEAR_HALF_BASE_RATIO;
    const horizontalInfluence = clamp(1 - Math.abs(x - centerX) / triangleHalfWidth, 0, 1);
    const influence = verticalInfluence * horizontalInfluence;
    if (influence === 0) return 0;

    const direction = x < centerX ? -1 : 1;
    const opening = direction * triangleHalfWidth * Math.pow(horizontalInfluence, 1.35) * elasticStretch;
    const fold = (Math.abs(Math.sin(y * 0.08 + x * 0.05)) - 0.5) * SCROLL_FOLD_STRENGTH;
    const ripple = Math.sin(y * 0.2 + x * 0.1) * SCROLL_RIPPLE_STRENGTH;
    const crumple = (fold + ripple) * influence * easedProgress * elasticStretch;
    return opening + crumple;
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
