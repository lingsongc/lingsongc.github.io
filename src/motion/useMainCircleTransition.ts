import gsap from "gsap";
import { useLayoutEffect, useRef, type RefObject } from "react";
import type { MainCircleDirectTransition, MainCircleEndpoint } from "../types/mainCircle";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime } from "./mainCircleTravel";

// Writes the persistent circle from explicit scene endpoints only.
export function useMainCircleTransition(
    circleRef: RefObject<HTMLDivElement | null>,
    directTransition: MainCircleDirectTransition,
) {
    const endpointsRef = useRef<{
        from: MainCircleEndpoint;
        key: string;
        to: MainCircleEndpoint;
    } | null>(null);

    useLayoutEffect(() => {
        const circle = circleRef.current;
        if (!circle) return;
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
            endpointsRef.current = null;
            gsap.set(circle, resolveEndpoint(currentSceneId));
            onTravelProgress?.(phase === "opening" ? 1 : 0);
            return;
        }

        const transitionKey = `${currentSceneId}:${requestedSceneId}`;
        if (endpointsRef.current?.key !== transitionKey) {
            endpointsRef.current = {
                from: resolveEndpoint(currentSceneId),
                key: transitionKey,
                to: resolveEndpoint(requestedSceneId),
            };
        }

        const endpoints = endpointsRef.current;
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
