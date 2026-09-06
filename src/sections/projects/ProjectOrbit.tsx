import { useLayoutEffect, useRef } from "react";
import type { Project } from "../../data/projects";
import {
    fitProjectAngleToViewport,
    projectOrbitAngle,
    projectRingCount,
    type ProjectPlanetStyle,
} from "./projectOrbitGeometry";

type ProjectOrbitProps = {
    activeProjectId: string;
    projects: readonly Project[];
    transitionState: "idle" | "visible" | "exiting";
    onProjectSelect: (project: Project) => void;
};

export function ProjectOrbit({
    activeProjectId,
    projects,
    transitionState,
    onProjectSelect,
}: ProjectOrbitProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const ringRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const planetRefs = useRef<Array<HTMLLIElement | null>>([]);
    const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useLayoutEffect(() => {
        const orbit = orbitRef.current;
        if (!orbit) return;

        const positionPlanets = () => {
            projects.forEach((project, index) => {
                const ringIndex = index % projectRingCount;
                const ring = ringRefs.current[ringIndex];
                const planet = planetRefs.current[index];
                const button = buttonRefs.current[index];
                if (!ring || !planet || !button) return;

                const angle = fitProjectAngleToViewport(
                    projectOrbitAngle(project.id, index, projects.length),
                    ring.offsetWidth / 2,
                    button.offsetWidth / 2,
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
        <div ref={orbitRef} className={`project-orbit${transitionState === "idle" ? "" : ` project-content-${transitionState}`}`}>
            <div aria-hidden="true">
                {Array.from({ length: projectRingCount }, (_, index) => (
                    <span
                        ref={(element) => { ringRefs.current[index] = element; }}
                        className={`project-ring project-ring-${["one", "two", "three"][index]}`}
                        key={index}
                    />
                ))}
            </div>
            <ul className="project-list">
                {projects.map((project, index) => {
                    const ringIndex = index % projectRingCount;
                    const angle = projectOrbitAngle(project.id, index, projects.length);
                    const style: ProjectPlanetStyle = {
                        "--project-angle": `${angle}deg`,
                        "--project-angle-inverse": `${-angle}deg`,
                    };

                    return (
                        <li
                            ref={(element) => { planetRefs.current[index] = element; }}
                            className={`project-item${ringIndex === 0 ? "" : ` project-item-ring-${ringIndex + 1}`}`}
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
