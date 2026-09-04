import type { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { BackgroundGrid } from "../components/BackgroundGrid";
import type { Project } from "../data/projects";

type ProjectPageLayoutProps = {
    project: Project;
    children: ReactNode;
};

export function ProjectPageLayout({ project, children }: ProjectPageLayoutProps) {
    return (
        <>
            <BackgroundGrid />
            <main className="project-detail-page">
                <a className="project-detail-back" href="../../#projects">
                    <IconArrowLeft aria-hidden="true" />
                    Back to projects
                </a>
                <article className="project-detail-content">
                    <img className="project-detail-image" src={`/projects/${project.id}.png`} alt="" />
                    <p className="project-detail-label">Project</p>
                    <h1>{project.name}</h1>
                    <p>{project.summary}</p>
                    {children}
                </article>
            </main>
        </>
    );
}
