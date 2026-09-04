import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { IconArrowUpRight } from "@tabler/icons-react";
import { projects, type Project } from "../data/projects";
import { sectionRestingBounds } from "../motion/sectionTransitionBounds";
import type { ImageDescriptor } from "../types/images";

const ringCount = 3;
type ProjectPlanetStyle = CSSProperties & {
    "--project-angle": string;
    "--project-angle-inverse": string;
};

type ProjectsProps = {
    sectionRef: RefObject<HTMLElement | null>;
    onMainCircleImageChange: (image: ImageDescriptor | null) => void;
};

const projectImage = (project: Project): ImageDescriptor => ({
    src: `/projects/${project.id}.png`,
    alt: "",
    objectPosition: "center",
});

function projectAngle(id: string, index: number, projectCount: number) {
    const separation = 360 / projectCount;
    const jitterLimit = Math.min(18, separation * 0.2);
    const hash = Array.from(id).reduce(
        (value, character) => (value * 31 + character.charCodeAt(0)) % 1000,
        0,
    );
    const jitter = (hash / 999 * 2 - 1) * jitterLimit;
    return 90 + index * separation + jitter;
}

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

export function Projects({ sectionRef, onMainCircleImageChange }: ProjectsProps) {
    const imageVisibleRef = useRef(false);
    const activeProjectRef = useRef(projects[0]);
    const [transitionState, setTransitionState] = useState<"idle" | "visible" | "exiting">("idle");
    const [activeProjectId, setActiveProjectId] = useState(projects[0].id);
    const activeProject = projects.find(({ id }) => id === activeProjectId) ?? projects[0];
    activeProjectRef.current = activeProject;

    useEffect(() => {
        const section = sectionRef.current;
        const restingContainer = section?.parentElement;
        if (!section || !restingContainer) return;

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

        updateContentVisibility();
        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        return () => {
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [onMainCircleImageChange]);

    useLayoutEffect(() => {
        const container = sectionRef.current;
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
        <section
            ref={sectionRef}
            id="projects"
            className={`project-container project-content-${transitionState}`}
            aria-labelledby="project-title"
        >
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
                    const angle = projectAngle(project.id, index, projects.length);
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
                            <button
                                className="project-link"
                                type="button"
                                aria-pressed={activeProjectId === project.id}
                                onClick={() => {
                                    setActiveProjectId(project.id);
                                    if (imageVisibleRef.current) onMainCircleImageChange(projectImage(project));
                                }}
                            >
                                <img className="project-image" src={`/projects/${project.id}.png`} alt="" />
                                <h3 className="project-name">{project.name}</h3>
                                <p className="project-summary">{project.summary}</p>
                            </button>
                        </li>
                    );
                })}
            </ul>
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
