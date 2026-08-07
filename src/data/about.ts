type Name = {
    fullName: string;
    firstName: string;
    lastName: string;
    isWestern: boolean;
}

export type HomeDetails = {
    name: Name;
    introduction: string;
}

export type AboutStatistics = {
    id: string;
    amount: number;
    detail: string;
}

export type AboutDetails = {
    description: string;
    statistics: AboutStatistics[];
}

const name: Name = {
    fullName: "Chen Ling Song",
    firstName: "Ling Song",
    lastName: "Chen",
    isWestern: false
}

export const homeDetails: HomeDetails = {
    name: name,
    introduction: "Currently surviving in NUS CS"
}

const aboutStatistics: AboutStatistics[] = [
    { id: "years", amount: 5, detail: "Years of Experience" },
    { id: "projects", amount: 5, detail: "Projects Completed" }
]

export const aboutDetails: AboutDetails = {
    description: "",
    statistics: aboutStatistics
}