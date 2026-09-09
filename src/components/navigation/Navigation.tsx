import {
    useEffect,
    useState,
    type CSSProperties,
    type MouseEvent,
    type RefObject,
} from "react";
import { transientRailMarkerProgress } from "../../motion/railTravelProgress";
import type { SceneId } from "../../types/scene";
import { navigationSections } from "./navigationSections";
import { useNavigationActiveSection } from "./useNavigationActiveSection";

export type NavigationSceneControl = {
    busy: boolean;
    currentSceneId: SceneId;
    destinationSceneId: SceneId | null;
    onSceneRequest: (sceneId: SceneId) => void;
    travelProgress: number;
};

type NavigationProps = {
    copyrightRef: RefObject<HTMLElement | null>;
    navigationRef: RefObject<HTMLElement | null>;
    onSectionNavigate: (sectionId: SceneId) => void;
    railRef: RefObject<HTMLDivElement | null>;
    sceneControl?: NavigationSceneControl;
};

// Renders the persistent section navigation and its matching visual rail.
export function Navigation({
    copyrightRef,
    navigationRef,
    onSectionNavigate,
    railRef,
    sceneControl,
}: NavigationProps) {
    const currentYear = new Date().getFullYear();
    const fallbackActiveSection = useNavigationActiveSection(sceneControl === undefined);
    const activeSection = sceneControl?.currentSceneId ?? fallbackActiveSection;
    const busy = sceneControl?.busy ?? false;
    const [touchLabel, setTouchLabel] = useState<string | null>(null);
    const visibleSections = navigationSections.filter((section) => section.id !== "home");
    const transientMarkers = sceneControl?.destinationSceneId
        ? transientRailMarkerProgress(
            sceneControl.currentSceneId,
            sceneControl.destinationSceneId,
            sceneControl.travelProgress,
        )
        : [];

    useEffect(() => setTouchLabel(null), [activeSection, busy]);

    // Reveals a label on the first touch, then follows the link on the second.
    const handleNavigationClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: SceneId) => {
        if (busy) {
            event.preventDefault();
            return;
        }
        const usesTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;

        if (usesTouch && event.detail !== 0 && touchLabel !== sectionId) {
            event.preventDefault();
            setTouchLabel(sectionId);
            return;
        }
        if (sceneControl) {
            event.preventDefault();
            sceneControl.onSceneRequest(sectionId);
        } else {
            onSectionNavigate(sectionId);
        }
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

            <nav
                ref={navigationRef}
                className={`navigation-container${sceneControl ? " navigation-controlled" : ""}${busy ? " navigation-busy" : ""}`}
                aria-label="Portfolio sections"
            >
                <ul className="navigation-list">
                    <li className="navigation-item navigation-theme-slot" aria-hidden="true" />

                    {visibleSections.map((section) => {
                        const markerProgress = transientMarkers.find(
                            (marker) => marker.sceneId === section.id,
                        )?.progress ?? 0;
                        return (
                            <li className="navigation-item" key={section.id}>
                                <a
                                    className={`navigation-link${activeSection === section.id
                                        ? " navigation-link-active"
                                        : ""}${touchLabel === section.id
                                        ? " navigation-link-touch-open"
                                        : ""}${markerProgress > 0
                                        ? " navigation-link-travelling"
                                        : ""}`}
                                    href={`#${section.id}`}
                                    aria-label={section.label}
                                    aria-current={activeSection === section.id ? "location" : undefined}
                                    aria-disabled={busy || undefined}
                                    tabIndex={busy ? -1 : undefined}
                                    style={{ "--navigation-travel-progress": markerProgress } as CSSProperties}
                                    onClick={(event) => handleNavigationClick(event, section.id)}
                                >
                                    <span className="navigation-label">{section.label}</span>
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </>
    );
}
