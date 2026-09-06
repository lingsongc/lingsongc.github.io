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
    viewportHeight: number,
) {
    const verticalLimit = Math.max(0, viewportHeight / 2 - planetRadius - 1);
    const safeOffset = Math.acos(Math.min(1, verticalLimit / radius)) * 180 / Math.PI;
    const normalizedAngle = (angle % 360 + 360) % 360;

    if (normalizedAngle < safeOffset) return safeOffset;
    if (normalizedAngle > 360 - safeOffset) return 360 - safeOffset;
    if (normalizedAngle > 180 - safeOffset && normalizedAngle < 180 + safeOffset) {
        return normalizedAngle < 180 ? 180 - safeOffset : 180 + safeOffset;
    }

    return normalizedAngle;
}
