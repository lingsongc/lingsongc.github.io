import { projectById } from "../data/projects";
import { ProjectPageLayout } from "./ProjectPageLayout";

const pneuRelief = projectById("pneurelief");

// Supplies PneuRelief content.
export function PneuReliefPage() {
    return (
        <ProjectPageLayout project={pneuRelief}>
            <section>
                <h2>Overview</h2>
                <p>Detailed PneuRelief project information will be added here.</p>
            </section>
        </ProjectPageLayout>
    );
}
