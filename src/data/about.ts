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
    description: `
        Hello! I’m a Computer Science student at NUS who spends a lot of time thinking about ideas, designing interfaces, and occasionally have a crisis on the state of AI.\n
        My main interest is frontend development because it sits at the intersection of technology and creativity. I enjoy taking an idea and shaping it into an enjoyable experience. Before writing any code, I usually explore the problem and flesh out the concept first. A little extra thinking at the beginning often makes the building process much more rewarding.\n
        When I’m not working on a project, I enjoy designing and making handicrafts. Both coding and crafting give me the same satisfaction of starting with a simple idea and turning it into something real. Ultimately, I hope to create projects that are well-designed and capable of making a meaningful difference.
    `,
    statistics: aboutStatistics
}
