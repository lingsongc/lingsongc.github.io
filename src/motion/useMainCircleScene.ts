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
        const contactSection = document.getElementById("contact");
        if (!homeImage || !aboutImage || !experienceImage || !projectImage || !projectDescription
            || !experiencePanel || !navigationRail || !aboutSection || !experienceSection
            || !projectsSection || !skillsSection || !contactSection) return;

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
        const contactCircleSize = () => Math.max(window.innerWidth, window.innerHeight) * 2.4;
        const contactCircleTop = () => window.innerHeight * 0.46 + contactCircleSize() / 2;
        const imageLayers = [
            [homeImage],
            [aboutImage],
            [experienceImage],
            [projectImage, projectDescription],
        ];
        let visibleImageLayer = -1;
        const updateImageLayer = () => {
            const nextLayer = aboutSection.getBoundingClientRect().top >= window.innerHeight ? 0
                : aboutSection.getBoundingClientRect().top <= 0
                    && experienceSection.getBoundingClientRect().top >= window.innerHeight ? 1
                : experienceSection.getBoundingClientRect().top <= 0
                    && projectsSection.getBoundingClientRect().top >= window.innerHeight ? 2
                : projectsSection.getBoundingClientRect().top <= 0
                    && skillsSection.getBoundingClientRect().top >= window.innerHeight ? 3
                : -1;

            if (nextLayer === visibleImageLayer) return;
            gsap.set(imageLayers.flat(), { opacity: 0 });
            if (nextLayer >= 0) gsap.set(imageLayers[nextLayer], { opacity: 1 });
            visibleImageLayer = nextLayer;
        };

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: updateImageLayer,
            onRefresh: updateImageLayer,
        });
        updateImageLayer();

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
                top: experienceCircleTop,
                left: experienceCircleLeft,
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
            .to(circle, { top: "50%", left: "50%" }, 0);

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
        }).to(circle, {
            width: contactCircleSize,
            top: contactCircleTop,
            left: "50%",
        }, 0);
    }, []);
}
