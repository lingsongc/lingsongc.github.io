import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useMainCircleScene(circleRef: RefObject<HTMLDivElement | null>) {
    useGSAP(() => {
        const circle = circleRef.current;
        if (!circle) return;

        const homeImage = circle.querySelector<HTMLElement>(".main-circle-image-home");
        const aboutImage = circle.querySelector<HTMLElement>(".main-circle-image-about");
        if (!homeImage || !aboutImage) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const aboutCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.95
            : window.innerHeight * 1.6;
        const aboutCircleLeft = () => aboutCircleSize()
            * (window.innerWidth <= 768 ? -0.2 : -0.1);

        gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: "#home",
                start: "top top",
                end: () => `bottom ${2 * Number.parseFloat(
                    getComputedStyle(document.documentElement).fontSize,
                )}px`,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, {
                width: aboutCircleSize,
                left: aboutCircleLeft,
                duration: 1,
            }, 0)
            .to(homeImage, { opacity: 0, duration: 0.2 }, 0)
            .to(aboutImage, { opacity: 1, duration: 0.2 }, 0.8);
    }, []);
}
