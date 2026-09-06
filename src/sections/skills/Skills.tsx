import { useEffect, type RefObject } from "react";
import { skills } from "../../data/skills";
import { alignMountedSectionAnchor } from "../../motion/sectionRestingBounds";

type SkillsProps = {
    restingContainerRef: RefObject<HTMLDivElement | null>;
};

type SkillGroup = {
    category: string;
    skills: typeof skills;
};

const skillGroups = skills.reduce<SkillGroup[]>((groups, skill) => {
    let group = groups.find(({ category }) => category === skill.category);
    if (!group) {
        group = { category: skill.category, skills: [] };
        groups.push(group);
    }
    group.skills.push(skill);
    return groups;
}, []);

function skillCategoryId(category: string) {
    return `skill-${category.toLowerCase().replaceAll(" ", "-")}`;
}

export function Skills({ restingContainerRef }: SkillsProps) {
    useEffect(() => {
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;

        let alignmentFrame: number | undefined;
        const animationFrame = window.requestAnimationFrame(() => {
            alignmentFrame = window.requestAnimationFrame(() => {
                alignMountedSectionAnchor(restingContainer);
            });
        });

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.cancelAnimationFrame(alignmentFrame ?? 0);
        };
    }, [restingContainerRef]);

    return (
        <section className="skill-container" aria-labelledby="skill-title">
            <h2 id="skill-title">Skills</h2>
            <div>
                {skillGroups.map((group) => {
                    const categoryId = skillCategoryId(group.category);
                    return (
                        <section aria-labelledby={categoryId} key={group.category}>
                            <h3 id={categoryId}>{group.category}</h3>
                            <ul>
                                {group.skills.map((skill) => (
                                    <li key={skill.name}>
                                        {skill.name}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}
            </div>
        </section>
    );
}
