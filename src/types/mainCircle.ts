import type gsap from "gsap";
import type { RefObject } from "react";

// Defines the shared geometry and transition contracts for the main circle.
export type MainCircleGeometryValue = string | number | (() => string | number);

export type MainCircleGeometry = gsap.TweenVars & {
    width: MainCircleGeometryValue;
    top?: MainCircleGeometryValue;
    left?: MainCircleGeometryValue;
};

export type MainCircleTransition = {
    target: RefObject<HTMLElement | null>;
    geometry: MainCircleGeometry;
};
