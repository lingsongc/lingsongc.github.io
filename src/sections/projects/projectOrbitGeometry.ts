import type { CSSProperties } from "react";

export type ProjectPlanetStyle = CSSProperties & {
    "--project-angle": string;
    "--project-angle-inverse": string;
};

// Gives each project a stable angle with a small ID-based variation.
export function projectOrbitAngle(id: string, index: number, projectCount: number) {
    const separation = 360 / projectCount;
    const jitterLimit = Math.min(18, separation * 0.2);
    const hash = Array.from(id).reduce(
        (value, character) => (value * 31 + character.charCodeAt(0)) % 1000,
        0,
    );
    const jitter = (hash / 999 * 2 - 1) * jitterLimit;
    return 90 + index * separation + jitter;
}

// Adjusts an angle when its planet would extend beyond the viewport.
export function fitProjectAngleToViewport(
    angle: number,
    radius: number,
    planetRadius: number,
    viewportWidth: number,
    viewportHeight: number,
) {
    const horizontalLimit = Math.max(0, viewportWidth / 2 - planetRadius - 1);
    const verticalLimit = Math.max(0, viewportHeight / 2 - planetRadius - 1);
    const normalizedAngle = (angle % 360 + 360) % 360;
    const isSafe = (candidate: number) => {
        const radians = candidate * Math.PI / 180;
        return Math.abs(Math.sin(radians) * radius) <= horizontalLimit
            && Math.abs(Math.cos(radians) * radius) <= verticalLimit;
    };
    if (isSafe(normalizedAngle)) return normalizedAngle;

    // Searches outward from the requested angle, then refines only the first safe boundary.
    const coarseStep = 0.25;
    for (let distance = coarseStep; distance <= 180; distance += coarseStep) {
        for (const direction of [1, -1]) {
            const candidate = normalizeAngle(normalizedAngle + distance * direction);
            if (!isSafe(candidate)) continue;
            let unsafeDistance = Math.max(0, distance - coarseStep);
            let safeDistance = distance;
            for (let refinement = 0; refinement < 12; refinement += 1) {
                const midpoint = (unsafeDistance + safeDistance) / 2;
                if (isSafe(normalizeAngle(normalizedAngle + midpoint * direction))) safeDistance = midpoint;
                else unsafeDistance = midpoint;
            }
            return normalizeAngle(normalizedAngle + safeDistance * direction);
        }
    }
    return normalizedAngle;
}

// Wraps angles while the outward search crosses zero degrees.
function normalizeAngle(angle: number) {
    return (angle % 360 + 360) % 360;
}
