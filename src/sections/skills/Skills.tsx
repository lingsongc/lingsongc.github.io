import { skills } from "../../data/skills";
import type { SceneLifecycleControl } from "../../types/scene";

type SkillsProps = {
    lifecycle: SceneLifecycleControl;
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

// Renders the complete skill list grouped by category.
export function Skills({ lifecycle }: SkillsProps) {
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    return (
        <section
            className={`skill-container skill-container-lifecycle${contentVisible ? " skill-content-visible" : ""}`}
            aria-labelledby="skill-title"
        >
            <h2 id="skill-title" tabIndex={-1}>Skills</h2>
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

// Converts a category name into a stable heading ID.
function skillCategoryId(category: string) {
    return `skill-${category.toLowerCase().replaceAll(" ", "-")}`;
}
