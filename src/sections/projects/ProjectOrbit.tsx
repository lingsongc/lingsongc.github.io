import { useLayoutEffect, useRef, type AnimationEvent } from "react";
import type { Project } from "../../data/projects";
import {
    fitProjectAngleToViewport,
    projectOrbitAngle,
    type ProjectPlanetStyle,
} from "./projectOrbitGeometry";

const PROJECT_RING_COUNT = 3;

export type ProjectOrbitTransitionState = "idle" | "visible" | "exiting";

type ProjectOrbitProps = {
    activeProjectId: string;
    projects: readonly Project[];
    transitionState: ProjectOrbitTransitionState;
    onProjectSelect: (project: Project) => void;
    onTransitionComplete?: () => void;
};

// Renders project controls across three rings and keeps them inside the viewport.
export function ProjectOrbit({
    activeProjectId,
    projects,
    transitionState,
    onProjectSelect,
    onTransitionComplete,
}: ProjectOrbitProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const ringRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const planetRefs = useRef<Array<HTMLLIElement | null>>([]);
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

    // Reports the final ring's owned entry or exit animation as orbit completion.
    const handleOrbitAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
        const target = event.target;
        if (
            !(target instanceof HTMLElement)
            || target.dataset.ringIndex !== String(PROJECT_RING_COUNT)
            || (event.animationName !== "project-orbit-enter" && event.animationName !== "project-orbit-exit")
        ) return;

        onTransitionComplete?.();
    };

    useLayoutEffect(() => {
        const orbit = orbitRef.current;
        if (!orbit) return;

        // Recalculates safe planet angles after the orbit changes size.
        const positionPlanets = () => {
            projects.forEach((project, index) => {
                const ringIndex = index % PROJECT_RING_COUNT;
                const ring = ringRefs.current[ringIndex];
                const planet = planetRefs.current[index];
                const button = buttonRefs.current[index];
                if (!ring || !planet || !button) return;

                const angle = fitProjectAngleToViewport(
                    projectOrbitAngle(project.id, index, projects.length),
                    ring.offsetWidth / 2,
                    button.offsetWidth / 2,
                    orbit.offsetWidth,
                    window.innerHeight,
                );
                planet.style.setProperty("--project-angle", `${angle}deg`);
                planet.style.setProperty("--project-angle-inverse", `${-angle}deg`);
            });
        };

        const resizeObserver = new ResizeObserver(positionPlanets);
        resizeObserver.observe(orbit);
        positionPlanets();
        return () => resizeObserver.disconnect();
    }, [projects]);

    return (
        <div
            ref={orbitRef}
            className={`project-orbit${transitionState === "idle" ? "" : ` project-content-${transitionState}`}`}
            onAnimationEnd={handleOrbitAnimationEnd}
        >
            <div aria-hidden="true">
                {Array.from({ length: PROJECT_RING_COUNT }, (_, index) => (
                    <span
                        ref={(element) => { ringRefs.current[index] = element; }}
                        className="project-ring"
                        data-ring-index={index + 1}
                        key={index}
                    />
                ))}
            </div>
            <ul className="project-list">
                {projects.map((project, index) => {
                    const ringIndex = index % PROJECT_RING_COUNT;
                    const angle = projectOrbitAngle(project.id, index, projects.length);
                    const style: ProjectPlanetStyle = {
                        "--project-angle": `${angle}deg`,
                        "--project-angle-inverse": `${-angle}deg`,
                    };

                    return (
                        <li
                            ref={(element) => { planetRefs.current[index] = element; }}
                            className="project-item"
                            data-ring-index={ringIndex + 1}
                            key={project.id}
                            style={style}
                        >
                            <button
                                ref={(element) => { buttonRefs.current[index] = element; }}
                                className="project-link"
                                type="button"
                                aria-pressed={activeProjectId === project.id}
                                onClick={() => onProjectSelect(project)}
                            >
                                <img className="project-image" src={`/projects/${project.id}.png`} alt="" />
                                <h3 className="visually-hidden">{project.name}</h3>
                                <p className="visually-hidden">{project.summary}</p>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
