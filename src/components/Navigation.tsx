import { useRef } from "react";
import { sections } from "../motion/sceneStates";
import { useActiveSection } from "../motion/useActiveSection";
import { useScrollScene } from "../motion/useScrollScene";

export function Navigation() {
    const currentYear = new Date().getFullYear();
    const navigationRef = useRef<HTMLElement>(null);
    const copyrightRef = useRef<HTMLElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const activeSection = useActiveSection();

    useScrollScene({ navigationRef, copyrightRef, ringRef });

    return (
        <>
            <div ref={ringRef} className="navigation-ring" aria-hidden="true" />
            <small ref={copyrightRef} className="navigation-copyright">
                Copyright © {currentYear} Chen Ling Song. All Rights Reserved.
            </small>

            <nav ref={navigationRef} className="navigation-container" aria-label="Portfolio sections">
                <ul className="navigation-list">
                    <li className="navigation-item navigation-theme-slot" aria-hidden="true" />

                    {sections.filter((section) => section.id !== "home").map((section) => (
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
