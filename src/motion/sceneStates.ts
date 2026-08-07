export const sections = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "experience", label: "Experience and Education" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export type SceneState = {
    xPercent: number;
    yPercent: number;
    scale: number;
    rotation: number;
};

export const sceneStates: Partial<Record<SectionId, SceneState>> = {};
