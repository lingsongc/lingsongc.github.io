import { projects } from "../data/projects";

export function Projects() {
    return (
        <section id="projects" className="project-container" aria-labelledby="project-title">
            <h2 id="project-title" className="project-title">Projects</h2>
            <ul className="project-list">
                {projects.map((project, index) => (
                    <li className="project-item" key={project.id}>
                        <a className="project-link" href={project.href}>
                            <span className="project-number" aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="project-name">{project.name}</h3>
                            <p className="project-summary">{project.summary}</p>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
