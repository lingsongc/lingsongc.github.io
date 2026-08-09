import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useState } from "react";
import { sections, type SectionId } from "./sceneStates";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useActiveSection() {
    const [activeSection, setActiveSection] = useState<SectionId>("home");

    useGSAP(() => {
        const sectionElements = sections.map(({ id }) => ({
            id,
            element: document.getElementById(id),
        })).filter((section): section is { id: SectionId; element: HTMLElement } => (
            section.element !== null
        ));

        const updateActiveSection = () => {
            const restingLine = 2 * Number.parseFloat(
                getComputedStyle(document.documentElement).fontSize,
            );
            let currentSection = sectionElements[0]?.id ?? "home";

            for (const section of sectionElements) {
                if (section.element.getBoundingClientRect().top <= restingLine) {
                    currentSection = section.id;
                }
            }

            if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1) {
                currentSection = sectionElements.at(-1)?.id ?? currentSection;
            }

            setActiveSection(currentSection);
        };

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: updateActiveSection,
            onRefresh: updateActiveSection,
        });
        updateActiveSection();
    }, []);

    return activeSection;
}
