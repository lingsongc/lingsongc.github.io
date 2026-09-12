import { type CSSProperties, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { sceneOrder, type SceneId, type ScenePhase } from "../../types/scene";
import { navigationSections } from "./navigationSections";

export type NavigationSceneControl = {
    busy: boolean;
    currentSceneId: SceneId;
    destinationSceneId: SceneId | null;
    onSceneRequest: (sceneId: SceneId) => void;
    phase: ScenePhase;
    travelProgress: number;
};

type NavigationProps = {
    railRef: RefObject<HTMLDivElement | null>;
    sceneControl: NavigationSceneControl;
};

// Renders the persistent section navigation and its matching visual rail.
export function Navigation({
    railRef,
    sceneControl,
}: NavigationProps) {
    const currentYear = new Date().getFullYear();
    const activeSection = sceneControl.currentSceneId;
    const busy = sceneControl.busy;
    const visibleSections = navigationSections.filter((section) => section.id !== "home");
    const transientMarkers = sceneControl.destinationSceneId
        ? transientRailMarkerProgress(
            sceneControl.currentSceneId,
            sceneControl.destinationSceneId,
            sceneControl.travelProgress,
        )
        : [];
    const positionClasses = controlledNavigationClasses(sceneControl);
    const copyrightClasses = controlledCopyrightClasses(sceneControl);

    // Activates named navigation immediately for mouse, touch, and keyboard clicks.
    const handleNavigationClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: SceneId) => {
        if (busy) {
            event.preventDefault();
            return;
        }
        event.preventDefault();
        sceneControl.onSceneRequest(sectionId);
    };

    // Gives Space the same named-control activation as Enter in controlled mode.
    const handleNavigationKeyDown = (
        event: KeyboardEvent<HTMLAnchorElement>,
        sectionId: SceneId,
    ) => {
        if (event.key !== " ") return;
        event.preventDefault();
        if (!busy) sceneControl.onSceneRequest(sectionId);
    };

    return (
        <>
            <div ref={railRef} className="navigation-rail">
                <span className="navigation-rail-slot" aria-hidden="true" />

                <small className={`navigation-copyright${copyrightClasses}`}>
                    Copyright © {currentYear} Chen Ling Song. All Rights Reserved.
                </small>
                
                <div className="navigation-rail-links" aria-hidden="true">
                    {visibleSections.map((section) => (
                        <span className="navigation-rail-slot" key={section.id} />
                    ))}
                </div>
            </div>

            <nav
                className={`navigation-container navigation-controlled${busy ? " navigation-busy" : ""}${positionClasses}`}
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
                                    onKeyDown={(event) => handleNavigationKeyDown(event, section.id)}
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

// Maps coordinator phases to Home-orbit, docked-rail, and timed rail travel classes.
function controlledNavigationClasses(sceneControl: NavigationSceneControl) {
    const { currentSceneId, destinationSceneId, phase } = sceneControl;
    if (currentSceneId === "home") {
        if (phase === "moving" && destinationSceneId !== "home") {
            return " navigation-docked navigation-rail-departing";
        }
        if (phase === "opening") return " navigation-home-entering";
        return " navigation-home-ready";
    }
    if (phase === "moving" && destinationSceneId === "home") {
        return " navigation-docked navigation-rail-returning";
    }
    return " navigation-docked navigation-effects-ready";
}

// Keeps copyright timing aligned with the controlled rail without owning scene state.
function controlledCopyrightClasses(sceneControl: NavigationSceneControl) {
    const { currentSceneId, destinationSceneId, phase } = sceneControl;
    if (currentSceneId === "home") {
        return phase === "moving" && destinationSceneId !== "home"
            ? " navigation-copyright-controlled-entering"
            : "";
    }
    return phase === "moving" && destinationSceneId === "home"
        ? " navigation-copyright-controlled-exiting"
        : " navigation-copyright-visible";
}

// Calculates visual-only intermediate marker fills in direct travel order.
export function transientRailMarkerProgress(fromSceneId: SceneId, toSceneId: SceneId, easedProgress: number) {
    const fromIndex = sceneOrder.indexOf(fromSceneId);
    const toIndex = sceneOrder.indexOf(toSceneId);
    const distance = Math.abs(toIndex - fromIndex);
    if (distance <= 1) return [];
    const direction = toIndex > fromIndex ? 1 : -1;
    const progress = clamp(easedProgress, 0, 1);
    return Array.from({ length: distance - 1 }, (_, index) => {
        const ordinal = index + 1;
        return {
            sceneId: sceneOrder[fromIndex + ordinal * direction],
            progress: clamp(1 - Math.abs(progress - ordinal / distance) * distance, 0, 1),
        };
    });
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum);
}
