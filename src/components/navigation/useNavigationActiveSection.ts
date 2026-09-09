import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useState } from "react";
import type { SceneId } from "../../types/scene";
import { navigationSections } from "./navigationSections";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Tracks the section currently resting near the top only while fallback mode is enabled.
export function useNavigationActiveSection(enabled = true) {
    const [activeSection, setActiveSection] = useState<SceneId>("home");

    useGSAP(() => {
        if (!enabled) return;
        const sectionElements = navigationSections.map(({ id }) => ({
            id,
            element: document.getElementById(id),
        })).filter((section): section is { id: SceneId; element: HTMLElement } => (
            section.element !== null
        ));

        // Selects the last section that has crossed the page's resting line.
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

            // Ensures the final section becomes active at the bottom of the page.
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
    }, { dependencies: [enabled], revertOnUpdate: true });

    return activeSection;
}
