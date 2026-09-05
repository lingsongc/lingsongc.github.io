import type { CSSProperties } from "react";

export const experienceOrbitGeometry = {
    viewBoxWidth: 360,
    viewBoxHeight: 100,
    radiusX: 177,
    radiusY: 47,
    rotation: -24,
    widthScale: 1.75,
    focusAngle: 125,
    angleStep: 36,
    scrollStep: 112,
    visibleBefore: 1,
    visibleAfter: 2,
} as const;

export const experienceOrbitViewBox = `0 0 ${experienceOrbitGeometry.viewBoxWidth} ${experienceOrbitGeometry.viewBoxHeight}`;
export const experienceOrbitFrontPath = [
    `M ${experienceOrbitGeometry.viewBoxWidth / 2 - experienceOrbitGeometry.radiusX} ${experienceOrbitGeometry.viewBoxHeight / 2}`,
    `A ${experienceOrbitGeometry.radiusX} ${experienceOrbitGeometry.radiusY} 0 0 0`,
    `${experienceOrbitGeometry.viewBoxWidth / 2 + experienceOrbitGeometry.radiusX} ${experienceOrbitGeometry.viewBoxHeight / 2}`,
].join(" ");

const experienceOrbitBaseStyles = {
    "--experience-ellipse-aspect-ratio": experienceOrbitGeometry.viewBoxWidth / experienceOrbitGeometry.viewBoxHeight,
    "--experience-ellipse-rotation": `${experienceOrbitGeometry.rotation}deg`,
    "--experience-ellipse-counter-rotation": `${-experienceOrbitGeometry.rotation}deg`,
} as CSSProperties;

export const experienceOrbitLayerStyles = {
    ...experienceOrbitBaseStyles,
    "--experience-ellipse-render-width": `${experienceOrbitGeometry.widthScale * 100}%`,
} as CSSProperties;

export const experienceOrbitSectionStyles = {
    ...experienceOrbitBaseStyles,
    "--experience-ellipse-render-width": `calc(var(--experience-circle-size) * ${experienceOrbitGeometry.widthScale})`,
} as CSSProperties;

export function experienceOrbitPoint(angle: number) {
    const radians = angle * Math.PI / 180;
    return {
        left: `${50 + Math.cos(radians) * experienceOrbitGeometry.radiusX / experienceOrbitGeometry.viewBoxWidth * 100}%`,
        top: `${50 + Math.sin(radians) * experienceOrbitGeometry.radiusY / experienceOrbitGeometry.viewBoxHeight * 100}%`,
    };
}

export function experienceOrbitPointIsVisible(angle: number) {
    const halfStep = experienceOrbitGeometry.angleStep / 2;
    const minimum = experienceOrbitGeometry.focusAngle
        - experienceOrbitGeometry.angleStep * experienceOrbitGeometry.visibleAfter
        - halfStep;
    const maximum = experienceOrbitGeometry.focusAngle
        + experienceOrbitGeometry.angleStep * experienceOrbitGeometry.visibleBefore
        + halfStep;
    return angle >= minimum && angle <= maximum;
}
