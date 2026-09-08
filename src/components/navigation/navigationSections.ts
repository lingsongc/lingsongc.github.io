import { sceneOrder, type SceneId } from "../../types/scene";

const navigationLabels = {
    home: "Home",
    about: "About",
    experience: "Experience and Education",
    projects: "Projects",
    skills: "Skills",
    contact: "Contact",
} satisfies Record<SceneId, string>;

// Combines shared scene order with Navigation-owned user-facing labels.
export const navigationSections = sceneOrder.map((id) => ({
    id,
    label: navigationLabels[id],
}));
