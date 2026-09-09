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

    // A hundredth-degree search keeps both axes visible without changing ring radii.
    let nearestAngle = normalizedAngle;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let step = 0; step < 36000; step += 1) {
        const candidate = step / 100;
        if (!isSafe(candidate)) continue;
        const directDistance = Math.abs(candidate - normalizedAngle);
        const distance = Math.min(directDistance, 360 - directDistance);
        if (distance >= nearestDistance - 0.000001) continue;
        nearestAngle = candidate;
        nearestDistance = distance;
    }
    return nearestAngle;
}
