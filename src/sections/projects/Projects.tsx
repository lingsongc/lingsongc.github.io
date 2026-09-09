import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { IconArrowUpRight } from "@tabler/icons-react";
import { projects, type Project } from "../../data/projects";
import { sectionRestingBounds } from "../../motion/sectionRestingBounds";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";
import { ProjectOrbit, type ProjectOrbitTransitionState } from "./ProjectOrbit";

type ProjectsProps = {
    lifecycle?: SceneLifecycleControl;
    restingContainerRef: RefObject<HTMLDivElement | null>;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Coordinates project selection, orbit visibility, and the main-circle image.
export function Projects({ lifecycle, restingContainerRef, onMainCircleImageChange }: ProjectsProps) {
    const imageVisibleRef = useRef(false);
    const activeProjectRef = useRef(projects[0]);
    const [fallbackTransitionState, setFallbackTransitionState] = useState<ProjectOrbitTransitionState>("idle");
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
    const activeProject = projects.find(({ id }) => id === activeProjectId) ?? projects[0];
    activeProjectRef.current = activeProject;
    const controlledTransitionState: ProjectOrbitTransitionState = lifecycle?.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle")
        ? "visible"
        : lifecycle?.active === true && lifecycle.phase === "closing"
            ? "exiting"
            : "idle";
    const transitionState = lifecycle ? controlledTransitionState : fallbackTransitionState;
    const contentVisible = transitionState === "visible";
    const controlled = lifecycle !== undefined;

    useEffect(() => {
        if (lifecycle) return;
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;

        let contentVisible = false;
        // Keeps fallback project content visible only at the resting position.
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY <= end;
            if (shouldShow === contentVisible) return;
            contentVisible = shouldShow;
            setFallbackTransitionState(shouldShow ? "visible" : "exiting");
        };

        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        updateContentVisibility();
        return () => {
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [lifecycle, restingContainerRef]);

    useEffect(() => {
        imageVisibleRef.current = contentVisible;
        onMainCircleImageChange(controlled || contentVisible ? projectImage(activeProjectRef.current) : null);
    }, [contentVisible, controlled, onMainCircleImageChange]);

    // Selects a project and updates the image when the section is visible.
    const selectProject = (project: Project) => {
        setActiveProjectId(project.id);
        if (imageVisibleRef.current) onMainCircleImageChange(projectImage(project));
    };

    return (
        <section
            className="project-container"
            aria-labelledby="project-title"
        >
            <h2 id="project-title" className="project-title">Projects</h2>
            <ProjectOrbit
                activeProjectId={activeProjectId}
                projects={projects}
                transitionState={transitionState}
                onProjectSelect={selectProject}
                onTransitionComplete={() => {
                    if (!lifecycle?.active || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")) return;
                    lifecycle.onTransitionComplete(lifecycle.phase);
                }}
            />
            {createPortal(
                <div
                    className={`project-selected-content scene-composition-layer${transitionState === "idle" ? "" : ` project-selected-content-${transitionState}`}`}
                    aria-hidden={!contentVisible}
                    aria-live="polite"
                >
                    <p className="project-selected-summary">{activeProject.summary}</p>
                </div>,
                document.body,
            )}
            <a
                className="project-detail-link"
                href={activeProject.href}
                aria-label={`View ${activeProject.name} project details`}
            >
                <IconArrowUpRight aria-hidden="true" />
            </a>
        </section>
    );
}

// Creates the image data published for a selected project.
function projectImage(project: Project): ImageDescriptor {
    return {
        src: `/projects/${project.id}.png`,
        alt: "",
        objectPosition: "center",
    };
}
