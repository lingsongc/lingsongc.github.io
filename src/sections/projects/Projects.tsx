import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { IconArrowUpRight } from "@tabler/icons-react";
import { projects, type Project } from "../../data/projects";
import {
    alignMountedSectionAnchor,
    sectionRestingBounds,
} from "../../motion/sectionRestingBounds";
import type { ImageDescriptor } from "../../types/images";
import { ProjectOrbit } from "./ProjectOrbit";

type ProjectsProps = {
    restingContainerRef: RefObject<HTMLDivElement | null>;
    onMainCircleImageChange: (image: ImageDescriptor | null) => void;
};

const projectImage = (project: Project): ImageDescriptor => ({
    src: `/projects/${project.id}.png`,
    alt: "",
    objectPosition: "center",
});

export function Projects({ restingContainerRef, onMainCircleImageChange }: ProjectsProps) {
    const imageVisibleRef = useRef(false);
    const activeProjectRef = useRef(projects[0]);
    const [transitionState, setTransitionState] = useState<"idle" | "visible" | "exiting">("idle");
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
    const activeProject = projects.find(({ id }) => id === activeProjectId) ?? projects[0];
    activeProjectRef.current = activeProject;

    useEffect(() => {
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;

        let contentVisible = false;
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY <= end;
            if (shouldShow === contentVisible) return;
            contentVisible = shouldShow;
            imageVisibleRef.current = shouldShow;
            setTransitionState(shouldShow ? "visible" : "exiting");
            onMainCircleImageChange(shouldShow ? projectImage(activeProjectRef.current) : null);
        };

        let alignmentFrame: number | undefined;
        const animationFrame = window.requestAnimationFrame(() => {
            alignmentFrame = window.requestAnimationFrame(() => {
                alignMountedSectionAnchor(restingContainer);
                updateContentVisibility();
            });
        });
        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.cancelAnimationFrame(alignmentFrame ?? 0);
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [onMainCircleImageChange, restingContainerRef]);

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
            />
            {createPortal(
                <div className={`project-selected-content project-selected-content-${transitionState}`} aria-live="polite">
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
