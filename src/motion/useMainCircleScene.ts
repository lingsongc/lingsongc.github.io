import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";
import {
    sectionTransitionScroll,
    sectionTransitionTimelineDefaults,
} from "./sectionTransitionBounds";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useMainCircleScene(circleRef: RefObject<HTMLDivElement | null>) {
    useGSAP(() => {
        const circle = circleRef.current;
        if (!circle) return;

        const homeImage = circle.querySelector<HTMLElement>(".main-circle-image-home");
        const aboutImage = circle.querySelector<HTMLElement>(".main-circle-image-about");
        const experienceImage = circle.querySelector<HTMLElement>(".main-circle-image-experience");
        const projectImage = circle.querySelector<HTMLElement>(".main-circle-image-project");
        const projectDescription = circle.querySelector<HTMLElement>(".main-circle-project-description");
        const experiencePanel = document.querySelector<HTMLElement>(".experience-panel");
        const navigationRail = document.querySelector<HTMLElement>(".navigation-rail");
        const aboutSection = document.getElementById("about");
        const experienceSection = document.getElementById("experience");
        const projectsSection = document.getElementById("projects");
        const skillsSection = document.getElementById("skills");
        if (!homeImage || !aboutImage || !experienceImage || !projectImage || !projectDescription
            || !experiencePanel || !navigationRail || !aboutSection || !experienceSection
            || !projectsSection || !skillsSection) return;

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
        const skillsCircleSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.9;
        const skillsCircleGap = () => (window.innerHeight - skillsCircleSize()) / 2;
        const skillsCircleLeft = () => navigationRail.getBoundingClientRect().left
            - skillsCircleGap()
            - skillsCircleSize() / 2;
        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(aboutSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, {
                width: aboutCircleSize,
                left: aboutCircleLeft,
            }, 0)
            .to(homeImage, { opacity: 0, duration: 0.2 }, 0)
            .to(aboutImage, { opacity: 1, duration: 0.2 }, 0.8);

        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(experienceSection),
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
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(projectsSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, { top: "50%", left: "50%" }, 0)
            .to(experienceImage, { opacity: 0, duration: 0.2 }, 0)
            .to([projectImage, projectDescription], { opacity: 1, duration: 0.2 }, 0.8);

        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(skillsSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, { width: skillsCircleSize, top: "50%", left: skillsCircleLeft }, 0)
            .to([projectImage, projectDescription], { opacity: 0, duration: 0.2 }, 0);
    }, []);
}
