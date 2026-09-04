import { StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { ModuloPage } from "./pages/ModuloPage";
import { PneuReliefPage } from "./pages/PneuReliefPage";
import "./styles/index.css";
import "./styles/pages/project-detail.css";

const projectPages: Record<string, ReactNode> = {
    modulo: <ModuloPage />,
    pneurelief: <PneuReliefPage />,
};

const rootElement = document.getElementById("root");
const projectPage = projectPages[document.body.dataset.projectId ?? ""];

if (!rootElement || !projectPage) {
    throw new Error("Project page could not be initialized.");
}

createRoot(rootElement).render(
    <StrictMode>{projectPage}</StrictMode>,
);
