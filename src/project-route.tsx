import { StrictMode, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { ModuloPage } from "./pages/ModuloPage";
import { PneuReliefPage } from "./pages/PneuReliefPage";
import "./styles/index.css";

const projectPages: Record<string, ComponentType> = {
    modulo: ModuloPage,
    pneurelief: PneuReliefPage,
};

const rootElement = document.getElementById("root");
const ProjectPage = projectPages[document.body.dataset.projectId ?? ""];

if (!rootElement || !ProjectPage) {
    throw new Error("Project page could not be initialized.");
}

createRoot(rootElement).render(
    <StrictMode>
        <ProjectPage />
    </StrictMode>,
);
