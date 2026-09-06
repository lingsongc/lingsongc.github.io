import { projectById } from "../data/projects";
import { ProjectPageLayout } from "./ProjectPageLayout";

const modulo = projectById("modulo");

// Supplies Modulo content.
export function ModuloPage() {
    return (
        <ProjectPageLayout project={modulo}>
            <section>
                <h2>Overview</h2>
                <p>Detailed Modulo project information will be added here.</p>
            </section>
        </ProjectPageLayout>
    );
}
