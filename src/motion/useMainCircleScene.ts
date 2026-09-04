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

        const experienceOrbit = document.querySelector<HTMLElement>(".experience-orbit");
        const navigationRail = document.querySelector<HTMLElement>(".navigation-rail");
        const aboutSection = document.getElementById("about");
        const experienceSection = document.getElementById("experience");
        const projectsSection = document.getElementById("projects");
        const skillsSection = document.getElementById("skills");
        const contactSection = document.getElementById("contact");
        if (!experienceOrbit || !navigationRail || !aboutSection || !experienceSection
            || !projectsSection || !skillsSection || !contactSection) return;

        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const aboutCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.95
            : window.innerHeight * 1.6;
        const aboutCircleLeft = () => aboutCircleSize()
            * (window.innerWidth <= 768 ? -0.2 : -0.1);
        const experienceCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.78
            : Math.min(window.innerWidth * 0.465, window.innerHeight * 0.69);
        const experienceCirclePosition = (axis: "left" | "top") => axis === "left"
            ? experienceOrbit.offsetLeft
            : experienceOrbit.offsetTop;
        const projectCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.576
            : Math.min(window.innerWidth * 0.384, window.innerHeight * 0.544);
        const skillsCircleSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.9;
        const skillsCircleGap = () => (window.innerHeight - skillsCircleSize()) / 2;
        const skillsCircleLeft = () => navigationRail.getBoundingClientRect().left
            - skillsCircleGap()
            - skillsCircleSize() / 2;
        const contactCircleSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.56;
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
            }, 0);

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
                top: () => experienceCirclePosition("top"),
                left: () => experienceCirclePosition("left"),
            }, 0);

        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(projectsSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, { width: projectCircleSize, top: "50%", left: "50%" }, 0);

        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(skillsSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(circle, { width: skillsCircleSize, top: "50%", left: skillsCircleLeft }, 0);

        gsap.timeline({
            defaults: sectionTransitionTimelineDefaults,
            scrollTrigger: {
                ...sectionTransitionScroll(contactSection),
                onUpdate: (self) => {
                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        }).to(circle, { width: contactCircleSize, top: "50%", left: "50%" }, 0);

    }, []);
}
