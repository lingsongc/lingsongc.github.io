import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import { sectionTransitionEnd, sectionTransitionStart } from "./sectionTransitionBounds";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useMainCircleScene(circleRef: RefObject<HTMLDivElement | null>) {
    useGSAP(() => {
        const circle = circleRef.current;
        if (!circle) return;

        const homeImage = circle.querySelector<HTMLElement>(".main-circle-image-home");
        const aboutImage = circle.querySelector<HTMLElement>(".main-circle-image-about");
        const experienceImage = circle.querySelector<HTMLElement>(".main-circle-image-experience");
        const experiencePanel = document.querySelector<HTMLElement>(".experience-panel");
        const homeSection = document.getElementById("home");
        const aboutSection = document.getElementById("about");
        const experienceSection = document.getElementById("experience");
        const projectsSection = document.getElementById("projects");
        if (!homeImage || !aboutImage || !experienceImage || !experiencePanel
            || !homeSection || !aboutSection || !experienceSection || !projectsSection) return;

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
        const experienceCircleOverlap = 64;
        const experienceCircleEdgeOffset = () => (
            experienceCircleReferenceSize() - experienceCircleSize()
        ) / 2;
        const experienceCircleLeft = () => experiencePanel.getBoundingClientRect().left
            + experienceCircleOverlap
            - experienceCircleSize() / 2;
        const experienceCircleTop = () => window.innerHeight * 0.58
            + experienceCircleEdgeOffset();
        gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: "#home-about-transition",
                start: () => sectionTransitionStart(homeSection),
                end: () => sectionTransitionEnd(aboutSection),
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
                trigger: "#about-experience-transition",
                start: () => sectionTransitionStart(aboutSection),
                end: () => sectionTransitionEnd(experienceSection),
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

        gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: "#experience-projects-transition",
                start: () => sectionTransitionStart(experienceSection),
                end: () => sectionTransitionEnd(projectsSection),
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, { top: "50%", left: "50%", duration: 1 }, 0)
            .to(experienceImage, { opacity: 0, duration: 0.2 }, 0);
    }, []);
}
