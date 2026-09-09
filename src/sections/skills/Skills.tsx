import { useEffect, useRef, type TransitionEvent } from "react";
import { skills } from "../../data/skills";
import type { SceneLifecycleControl } from "../../types/scene";

type SkillsProps = {
    lifecycle?: SceneLifecycleControl;
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
    const sectionRef = useRef<HTMLElement>(null);
    const contentVisible = lifecycle?.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    useEffect(() => {
        if (!lifecycle?.active || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")) return;
        const section = sectionRef.current;
        const hasTimedTransition = section
            ? getComputedStyle(section).transitionDuration
                .split(",")
                .some((duration) => Number.parseFloat(duration) > 0)
            : false;
        if (!section || hasTimedTransition) return;

        lifecycle.onTransitionComplete(lifecycle.phase);
    }, [lifecycle?.onTransitionComplete, lifecycle?.phase]);

    // Reports completion from the minimal Skills visibility transition.
    const handleTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
        if (
            !lifecycle?.active
            || event.target !== event.currentTarget
            || event.propertyName !== "opacity"
            || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")
        ) return;

        lifecycle.onTransitionComplete(lifecycle.phase);
    };

    return (
        <section
            ref={sectionRef}
            className={`skill-container${lifecycle ? " skill-container-lifecycle" : ""}${contentVisible ? " skill-content-visible" : ""}`}
            aria-labelledby="skill-title"
            onTransitionEnd={handleTransitionEnd}
        >
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

// Converts a category name into a stable heading ID.
function skillCategoryId(category: string) {
    return `skill-${category.toLowerCase().replaceAll(" ", "-")}`;
}
