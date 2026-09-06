import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import type { MainCircleTransition } from "../types/mainCircle";
import { elementDocumentTop, sectionIncomingTransitionRange } from "./sectionRestingBounds";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const mainCircleTimelineDefaults = { duration: 1, ease: "none" };

// Moves and resizes the main circle as each section enters its resting position.
export function useMainCircleTransition(
    circleRef: RefObject<HTMLDivElement | null>,
    transitions: readonly MainCircleTransition[],
) {
    useGSAP(() => {
        const circle = circleRef.current;
        if (!circle) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const timelines: gsap.core.Timeline[] = [];
        
        const setupFrame = window.requestAnimationFrame(() => {
            transitions.forEach(({ target, geometry }) => {
                const targetElement = target.current;
                if (!targetElement) return;

                timelines.push(gsap.timeline({
                    defaults: mainCircleTimelineDefaults,
                    scrollTrigger: {
                        ...mainCircleTransitionScroll(targetElement),
                        onUpdate: (self) => {
                            // Reduced motion switches between endpoints instead of scrubbing continuously.
                            if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                        },
                    },
                }).to(circle, geometry, 0));
            });

            ScrollTrigger.refresh();
        });

        return () => {
            window.cancelAnimationFrame(setupFrame);
            timelines.forEach((timeline) => {
                timeline.scrollTrigger?.kill();
                timeline.kill();
            });
        };
    }, [transitions]);
}

// Defines the scroll range for one incoming section handoff.
function mainCircleTransitionScroll(incomingSection: HTMLElement) {
    return {
        trigger: incomingSection,
        start: () => sectionIncomingTransitionRange(
            elementDocumentTop(incomingSection),
            window.innerHeight,
        ).start,
        end: () => sectionIncomingTransitionRange(
            elementDocumentTop(incomingSection),
            window.innerHeight,
        ).end,
        scrub: true,
        invalidateOnRefresh: true,
    };
}
