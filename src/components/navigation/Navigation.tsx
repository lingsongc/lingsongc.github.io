import { useEffect, useState, type MouseEvent, type RefObject } from "react";
import { navigationSections } from "./navigationSections";
import { useNavigationActiveSection } from "./useNavigationActiveSection";

type NavigationProps = {
    copyrightRef: RefObject<HTMLElement | null>;
    navigationRef: RefObject<HTMLElement | null>;
    onSectionNavigate: (sectionId: string) => void;
    railRef: RefObject<HTMLDivElement | null>;
};

// Renders the persistent section navigation and its matching visual rail.
export function Navigation({ copyrightRef, navigationRef, onSectionNavigate, railRef }: NavigationProps) {
    const currentYear = new Date().getFullYear();
    const activeSection = useNavigationActiveSection();
    const [touchLabel, setTouchLabel] = useState<string | null>(null);
    const visibleSections = navigationSections.filter((section) => section.id !== "home");

    useEffect(() => setTouchLabel(null), [activeSection]);

    // Reveals a label on the first touch, then follows the link on the second.
    const handleNavigationClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
        const usesTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

        if (usesTouch && event.detail !== 0 && touchLabel !== sectionId) {
            event.preventDefault();
            setTouchLabel(sectionId);
            return;
        }
        onSectionNavigate(sectionId);
    };

    return (
        <>
            <div ref={railRef} className="navigation-rail">
                <span className="navigation-rail-slot" aria-hidden="true" />

                <small ref={copyrightRef} className="navigation-copyright">
                    Copyright © {currentYear} Chen Ling Song. All Rights Reserved.
                </small>
                
                <div className="navigation-rail-links" aria-hidden="true">
                    {visibleSections.map((section) => (
                        <span className="navigation-rail-slot" key={section.id} />
                    ))}
                </div>
            </div>

            <nav ref={navigationRef} className="navigation-container" aria-label="Portfolio sections">
                <ul className="navigation-list">
                    <li className="navigation-item navigation-theme-slot" aria-hidden="true" />

                    {visibleSections.map((section) => (
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
