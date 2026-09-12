import { useEffect, useState } from "react";
import { ScenePanelOverlay } from "../../components/scene-panel/ScenePanel";
import { IconArrowUpRight } from "@tabler/icons-react";
import { projects, type Project } from "../../data/projects";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";
import { ProjectOrbit, type ProjectOrbitTransitionState } from "./ProjectOrbit";

type ProjectsProps = {
    lifecycle: SceneLifecycleControl;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Coordinates project selection, orbit visibility, and the main-circle image.
export function Projects({ lifecycle, onMainCircleImageChange }: ProjectsProps) {
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
    const activeProject = projects.find(({ id }) => id === activeProjectId) ?? projects[0];
    const transitionState: ProjectOrbitTransitionState = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle")
        ? "visible"
        : lifecycle?.active === true && lifecycle.phase === "closing"
            ? "exiting"
            : "idle";
    useEffect(() => {
        onMainCircleImageChange(projectImage(activeProject));
    }, [activeProject, onMainCircleImageChange]);

    // Selects a project and updates the image when the section is visible.
    const selectProject = (project: Project) => {
        setActiveProjectId(project.id);
    };

    return (
        <section
            className="project-container"
            aria-labelledby="project-title"
        >
            <h2 id="project-title" className="project-title" tabIndex={-1}>Projects</h2>
            <ProjectOrbit
                activeProjectId={activeProjectId}
                projects={projects}
                transitionState={transitionState}
                onProjectSelect={selectProject}
            />
            <ScenePanelOverlay>
                <div
                    className={`project-selected-content${transitionState === "idle" ? "" : ` project-selected-content-${transitionState}`}`}
                    aria-live="polite"
                >
                    <p className="project-selected-summary">{activeProject.summary}</p>
                </div>
            </ScenePanelOverlay>
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
