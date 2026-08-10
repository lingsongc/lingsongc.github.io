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
        const experienceImage = circle.querySelector<HTMLElement>(".main-circle-image-experience");
        if (!homeImage || !aboutImage || !experienceImage) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const aboutCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.95
            : window.innerHeight * 1.6;
        const aboutCircleLeft = () => aboutCircleSize()
            * (window.innerWidth <= 768 ? -0.2 : -0.1);
        const experienceCircleReferenceSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.72
            : Math.min(window.innerWidth * 0.48, window.innerHeight * 0.68);
        const experienceCircleSize = () => experienceCircleReferenceSize() * 0.8;
        const experienceCircleEdgeOffset = () => (
            experienceCircleReferenceSize() - experienceCircleSize()
        ) / 2;
        const experienceCircleLeft = () => window.innerWidth
            * (window.innerWidth <= 768 ? 0.5 : 0.6)
            + experienceCircleEdgeOffset();
        const experienceCircleTop = () => window.innerHeight * 0.55
            + experienceCircleEdgeOffset();

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

        gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: "#about",
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
                width: experienceCircleSize,
                top: experienceCircleTop,
                left: experienceCircleLeft,
            }, 0)
            .to(aboutImage, { opacity: 0, duration: 0.2 }, 0)
            .to(experienceImage, { opacity: 1, duration: 0.2 }, 0.8);
    }, []);
}
