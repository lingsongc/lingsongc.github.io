import { projects } from "../data/projects";

export function Projects() {
    return (
        <section id="projects" className="project-container" aria-labelledby="project-title">
            <div className="project-rings" aria-hidden="true">
                <span className="orbit-ring project-ring project-ring-one" />
                <span className="orbit-ring project-ring project-ring-two" />
                <span className="orbit-ring project-ring project-ring-three" />
            </div>
            <h2 id="project-title" className="project-title">Projects</h2>
            <ul className="project-list">
                {projects.map((project, index) => (
                    <li className="project-item" key={project.id}>
                        <a className="project-link" href={project.href}>
                            <h3 className="project-name">{project.name}</h3>
                            <p className="project-summary">{project.summary}</p>
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
