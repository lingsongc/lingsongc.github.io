import type gsap from "gsap";
import type { RefObject } from "react";

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
