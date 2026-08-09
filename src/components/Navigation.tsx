import { useRef } from "react";
import { sections } from "../motion/sceneStates";
import { useActiveSection } from "../motion/useActiveSection";
import { useScrollScene } from "../motion/useScrollScene";

export function Navigation() {
    const currentYear = new Date().getFullYear();
    const navigationRef = useRef<HTMLElement>(null);
    const copyrightRef = useRef<HTMLElement>(null);
    const railRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const activeSection = useActiveSection();
    const navigationSections = sections.filter((section) => section.id !== "home");

    useScrollScene({ navigationRef, copyrightRef, railRef, ringRef });

    return (
        <>
            <div ref={ringRef} className="navigation-ring" aria-hidden="true" />

            <div ref={railRef} className="navigation-rail">
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
                                    : ""}`}
                                href={`#${section.id}`}
                                aria-label={section.label}
                                aria-current={activeSection === section.id ? "location" : undefined}
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
