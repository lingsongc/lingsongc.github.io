import { useEffect, useRef, useState, type MouseEvent } from "react";
import { sections } from "../motion/sceneStates";
import { useActiveSection } from "../motion/useActiveSection";
import { useScrollScene } from "../motion/useScrollScene";

export function Navigation() {
    const currentYear = new Date().getFullYear();
    const navigationRef = useRef<HTMLElement>(null);
    const copyrightRef = useRef<HTMLElement>(null);
    const activeSection = useActiveSection();
    const [touchLabel, setTouchLabel] = useState<string | null>(null);
    const navigationSections = sections.filter((section) => section.id !== "home");

    useScrollScene({ navigationRef, copyrightRef });
    useEffect(() => setTouchLabel(null), [activeSection]);

    const handleNavigationClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        const usesTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

        if (!usesTouch || event.detail === 0 || touchLabel === sectionId) return;

        event.preventDefault();
        setTouchLabel(sectionId);
    };

    return (
        <>
            <div className="navigation-rail">
                <span className="navigation-rail-slot" aria-hidden="true" />
                <small ref={copyrightRef} className="navigation-copyright">
                    Copyright © {currentYear} Chen Ling Song. All Rights Reserved.
                </small>
                <div className="navigation-rail-links" aria-hidden="true">
                    {navigationSections.map((section) => (
                        <span className="navigation-rail-slot" key={section.id} />
                    ))}
                </div>
            </div>

            <nav ref={navigationRef} className="navigation-container" aria-label="Portfolio sections">
                <ul className="navigation-list">
                    <li className="navigation-item navigation-theme-slot" aria-hidden="true" />

                    {navigationSections.map((section) => (
                        <li className="navigation-item" key={section.id}>
                            <a
                                className={`navigation-link${activeSection === section.id
                                    ? " navigation-link-active"
                                    : ""}${touchLabel === section.id
                                    ? " navigation-link-touch-open"
                                    : ""}`}
                                href={`#${section.id}`}
                                aria-label={section.label}
                                aria-current={activeSection === section.id ? "location" : undefined}
                                onClick={(event) => handleNavigationClick(event, section.id)}
                            >
                                <span className="navigation-label">{section.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </nav>
        </>
    );
}
