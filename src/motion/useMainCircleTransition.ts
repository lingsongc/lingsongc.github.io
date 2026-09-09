import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type RefObject } from "react";
import type {
    MainCircleDirectTransition,
    MainCircleEndpoint,
    MainCircleGeometryValue,
    MainCircleTransition,
} from "../types/mainCircle";
import type { SceneId } from "../types/scene";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime } from "./mainCircleTravel";
import { mainCircleStateAtScroll, type MainCircleHandoff, type MainCircleState } from "./mainCircleTransitionState";
import { elementDocumentTop, sectionIncomingTransitionRange } from "./sectionRestingBounds";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Moves and resizes the main circle as each section enters its resting position.
export function useMainCircleTransition(
    circleRef: RefObject<HTMLDivElement | null>,
    transitions: readonly MainCircleTransition[],
    navigationTargetId: SceneId | null,
    directTransition?: MainCircleDirectTransition,
) {
    const linkedSectionUpdaterRef = useRef<(sectionId: SceneId | string) => void>(() => undefined);
    const directEndpointsRef = useRef<{
        from: MainCircleEndpoint;
        key: string;
        to: MainCircleEndpoint;
    } | null>(null);
    const directEnabled = directTransition !== undefined;

    useGSAP(() => {
        if (directEnabled) return;
        const circle = circleRef.current;
        if (!circle) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const initialState = readInitialCircleState(circle);
        let scrollTrigger: ScrollTrigger | undefined;
        let updateCircle: () => void = () => undefined;
        let updateLinkedCircle: () => void = () => undefined;

        // Waits one frame so refs owned by later page sections are ready.
        const setupFrame = window.requestAnimationFrame(() => {
            // One writer prevents skipped section jumps from mixing different timeline states.
            const applyCircleAtScroll = (scrollY: number) => {
                const handoffs = resolveMainCircleHandoffs(initialState, transitions);
                gsap.set(circle, mainCircleStateAtScroll(
                    scrollY,
                    initialState,
                    handoffs,
                    reducedMotion,
                ));
            };
            updateCircle = () => applyCircleAtScroll(window.scrollY);
            linkedSectionUpdaterRef.current = (sectionId) => {
                const target = transitions.find(({ target }) => target.current?.id === sectionId)?.target.current;
                if (target) applyCircleAtScroll(elementDocumentTop(target));
            };
            updateLinkedCircle = () => linkedSectionUpdaterRef.current(window.location.hash.slice(1));

            scrollTrigger = ScrollTrigger.create({
                trigger: document.documentElement,
                start: "top top",
                end: "max",
                invalidateOnRefresh: true,
                onRefresh: updateCircle,
            });
            window.addEventListener("scroll", updateCircle, { passive: true });
            window.addEventListener("resize", updateCircle);
            window.addEventListener("hashchange", updateLinkedCircle);
            updateCircle();
        });

        return () => {
            window.cancelAnimationFrame(setupFrame);
            window.removeEventListener("scroll", updateCircle);
            window.removeEventListener("resize", updateCircle);
            window.removeEventListener("hashchange", updateLinkedCircle);
            linkedSectionUpdaterRef.current = () => undefined;
            scrollTrigger?.kill();
        };
    }, { dependencies: [transitions, directEnabled], revertOnUpdate: true });

    useLayoutEffect(() => {
        if (!directEnabled && navigationTargetId) linkedSectionUpdaterRef.current(navigationTargetId);
    }, [directEnabled, navigationTargetId]);

    useLayoutEffect(() => {
        const circle = circleRef.current;
        if (!circle || !directTransition) return;
        const {
            currentSceneId,
            ease,
            onTravelProgress,
            phase,
            requestedSceneId,
            resolveEndpoint,
            travelProgress,
        } = directTransition;

        if (phase !== "moving" || !requestedSceneId) {
            directEndpointsRef.current = null;
            gsap.set(circle, resolveEndpoint(currentSceneId));
            onTravelProgress?.(phase === "opening" ? 1 : 0);
            return;
        }

        const transitionKey = `${currentSceneId}:${requestedSceneId}`;
        if (directEndpointsRef.current?.key !== transitionKey) {
            directEndpointsRef.current = {
                from: resolveEndpoint(currentSceneId),
                key: transitionKey,
                to: resolveEndpoint(requestedSceneId),
            };
        }

        const endpoints = directEndpointsRef.current;
        const snapshot = mainCircleTravelAtTime(
            endpoints.from,
            endpoints.to,
            travelProgress * MAIN_CIRCLE_TRAVEL_DURATION_MS,
            ease ?? smoothDirectTravelEase,
        );
        gsap.set(circle, snapshot.endpoint);
        onTravelProgress?.(snapshot.easedProgress);
    }, [circleRef, directTransition]);
}

// Gives direct travel smooth acceleration and deceleration without overshoot.
function smoothDirectTravelEase(progress: number) {
    return progress * progress * (3 - 2 * progress);
}

// Reads the circle's CSS-defined Home geometry before scroll motion changes it.
function readInitialCircleState(circle: HTMLElement): MainCircleState {
    const style = window.getComputedStyle(circle);
    return {
        width: Number.parseFloat(style.width),
        top: Number.parseFloat(style.top),
        left: Number.parseFloat(style.left),
    };
}

// Resolves every section descriptor into a complete numeric handoff.
function resolveMainCircleHandoffs(
    initialState: MainCircleState,
    transitions: readonly MainCircleTransition[],
) {
    const handoffs: MainCircleHandoff[] = [];
    let previousState = initialState;

    transitions.forEach(({ target, geometry }) => {
        const targetElement = target.current;
        if (!targetElement) return;

        const sectionTop = elementDocumentTop(targetElement);
        const range = sectionIncomingTransitionRange(sectionTop, window.innerHeight);
        const nextState = {
            width: resolveGeometryValue(geometry.width, window.innerWidth),
            top: geometry.top === undefined
                ? previousState.top
                : resolveGeometryValue(geometry.top, window.innerHeight),
            left: geometry.left === undefined
                ? previousState.left
                : resolveGeometryValue(geometry.left, window.innerWidth),
        };

        handoffs.push({ ...range, from: previousState, to: nextState });
        previousState = nextState;
    });

    return handoffs;
}

// Converts a pixel, percentage, or calculated geometry value into pixels.
function resolveGeometryValue(value: MainCircleGeometryValue, referenceSize: number) {
    const resolvedValue = typeof value === "function" ? value() : value;
    if (typeof resolvedValue === "number") return resolvedValue;
    if (resolvedValue.endsWith("%")) {
        return referenceSize * Number.parseFloat(resolvedValue) / 100;
    }
    return Number.parseFloat(resolvedValue);
}
