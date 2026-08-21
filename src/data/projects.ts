export type Project = {
    id: string;
    name: string;
    summary: string;
    href: string;
};

export const projects: Project[] = [
    {
        id: "modulo",
        name: "Modulo",
        summary: "A cross-platform academic companion for students in Singapore, combining timetable parsing, task management, Google Drive sync, and gamified study sessions.",
        href: ""
    },
    {
        id: "pneurelief",
        name: "PneuRelief",
        summary: "A smart under-cast sock and alternating bubble patch that detect and prevent pressure ulcers before they become dangerous, while providing control via an app",
        href: ""
    }
];
