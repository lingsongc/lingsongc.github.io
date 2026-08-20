import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { projects } from "../data/projects";

const ringCount = 3;
type ProjectPlanetStyle = CSSProperties & {
    "--project-angle": string;
    "--project-angle-inverse": string;
};

function fitAngleToViewport(angle: number, radius: number, planetRadius: number, viewportHeight: number) {
    const verticalLimit = Math.max(0, viewportHeight / 2 - planetRadius - 1);
    const safeOffset = Math.acos(Math.min(1, verticalLimit / radius)) * 180 / Math.PI;
    const normalizedAngle = (angle % 360 + 360) % 360;

    if (normalizedAngle < safeOffset) return safeOffset;
    if (normalizedAngle > 360 - safeOffset) return 360 - safeOffset;
    if (normalizedAngle > 180 - safeOffset && normalizedAngle < 180 + safeOffset) {
        return normalizedAngle < 180 ? 180 - safeOffset : 180 + safeOffset;
    }

    return normalizedAngle;
}

export function Projects() {
    const containerRef = useRef<HTMLElement>(null);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const positionPlanets = () => {
            const rings = Array.from(container.querySelectorAll<HTMLElement>(".project-ring"));
            container.querySelectorAll<HTMLElement>(".project-item").forEach((planet) => {
                const ring = rings[Number(planet.dataset.projectRing)];
                const link = planet.querySelector<HTMLElement>(".project-link");
                if (!ring || !link) return;

                const angle = fitAngleToViewport(
                    Number(planet.dataset.projectAngle),
                    ring.offsetWidth / 2,
                    link.offsetWidth / 2,
                    window.innerHeight,
                );
                planet.style.setProperty("--project-angle", `${angle}deg`);
                planet.style.setProperty("--project-angle-inverse", `${-angle}deg`);
            });
        };

        const resizeObserver = new ResizeObserver(positionPlanets);
        resizeObserver.observe(container);
        positionPlanets();
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <section ref={containerRef} id="projects" className="project-container" aria-labelledby="project-title">
            <div className="project-rings" aria-hidden="true">
                <span className="orbit-ring project-ring project-ring-one" />
                <span className="orbit-ring project-ring project-ring-two" />
                <span className="orbit-ring project-ring project-ring-three" />
            </div>
            <h2 id="project-title" className="project-title">Projects</h2>
            <ul className="project-list">
                {projects.map((project, index) => {
                    const placementIndex = index % ringCount;
                    const ringIndex = placementIndex;
                    const positionOnRing = Math.floor(index / ringCount);
                    const projectsOnRing = Math.ceil((projects.length - placementIndex) / ringCount);
                    const ringAngle = projects.length === 2 ? placementIndex * 180 : placementIndex * 120;
                    const angle = 90 + ringAngle + positionOnRing * 360 / projectsOnRing;
                    const style: ProjectPlanetStyle = {
                        "--project-angle": `${angle}deg`,
                        "--project-angle-inverse": `${-angle}deg`,
                    };

                    return (
                        <li
                            className={`project-item project-item-ring-${ringIndex + 1}`}
                            key={project.id}
                            style={style}
                            data-project-angle={angle}
                            data-project-ring={ringIndex}
                        >
                            <a className="project-link" href={project.href || "#projects"}>
                                <span className="project-number" aria-hidden="true">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                                <h3 className="project-name">{project.name}</h3>
                                <p className="project-summary">{project.summary}</p>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
