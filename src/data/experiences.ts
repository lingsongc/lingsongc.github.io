export type Experience = {
    id: string;
    organisation: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    highlights: string[];
};

export const experiences: Experience[] = [
    {
        id: "picolove",
        organisation: "Project Picolove, Rotaract Club of NUS",
        role: "Treasurer",
        startDate: "Sep 2025",
        endDate: "May 2026",
        description: "Supported village communities in Ha Giang, Vietnam through a student-led Youth Expedition Project.",
        highlights: [
            "Managed thousands of dollars in donations, fundraiser income, and sponsorship funds.",
            "Built a cashiering system in Google Sheets using formulas and Google Apps Script to reduce transaction errors.",
            "Helped raise funds for children's education and participated in constructing a village road."
        ]
    },
    {
        id: "ns",
        organisation: "Singapore Armed Forces",
        role: "Leopard 2SG Tracked Technician",
        startDate: "2023",
        endDate: "2025",
        description: "Provided maintenance support for Leopard 2SG main battle tanks as a Corporal First Class.",
        highlights: [
            "Diagnosed vehicle faults and trained junior technicians in repair methods.",
            "Supported Armour training and Exercise Panzer Strike in Germany.",
            "Built a Telegram bot with Google Sheets and Google Apps Script to track tank servicing."
        ]
    },
    {
        id: "bbcs",
        organisation: "BuildingBloCS",
        role: "Head of Administration and Team Lead",
        startDate: "Jan 2022",
        endDate: "Jun 2022",
        description: "Helped plan and deliver BuildingBloCS 2022 for students nationwide.",
        highlights: [
            "Led the administration team and organized data for more than 150 participants and facilitators.",
            "Presented two workshops introducing students to C++.",
            "Received an ACJC Certificate of Commendation for leadership and event management."
        ]
    },
    {
        id: "ocip",
        organisation: "ACJC Overseas Community Involvement Project",
        role: "Logistics Head",
        startDate: "2021",
        endDate: "2021",
        description: "Supported students in Chiang Mai, Thailand through an online community project.",
        highlights: [
            "Coordinated, sourced, and purchased hands-on learning materials.",
            "Managed the delivery of materials from Singapore to Thailand.",
            "Taught science through activities such as constructing a periscope."
        ]
    }
];
