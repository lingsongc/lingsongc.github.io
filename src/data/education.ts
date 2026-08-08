export type Education = {
    id: string;
    institution: string;
    qualification: string;
    startDate: string;
    endDate: string;
    description: string;
    highlights: string[];
};

export const education: Education[] = [
    {
        id: "nus",
        institution: "National University of Singapore",
        qualification: "Computer Science",
        startDate: "2025",
        endDate: "2029 (Expected)",
        description: "Pursuing undergraduate studies in computer science.",
        highlights: [
            "Named to the School of Computing Dean's List for AY25/26 Semester 2.",
            "Won the BrainHack TIL-AI Novice category in 2026."
        ]
    },
    {
        id: "acjc",
        institution: "Anglo-Chinese Junior College",
        qualification: "GCE A-Level",
        startDate: "2021",
        endDate: "2022",
        description: "Completed the GCE A-Level programme.",
        highlights: [
            "Received a Certificate of Commendation for leadership and event management for BuildingBloCS 2022.",
            "Received a Certificate of Outstanding Service for contributions to co-curricular activities.",
            "Earned a distinction in the 2022 Canadian Computing Competition, placing within the top 25 percent of the Junior Division."
        ]
    }
];
