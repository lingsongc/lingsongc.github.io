import { skills } from "../data/skills";
import type { RefObject } from "react";

type SkillsProps = {
    sectionRef: RefObject<HTMLElement | null>;
};

export function Skills({ sectionRef }: SkillsProps) {
    return (
        <section ref={sectionRef} id="skills" className="skill-container" aria-labelledby="skill-title">
            <h2 id="skill-title" className="skill-title">Skills</h2>
            <ul className="skill-list">
                {skills.map((skill) => (
                    <li className="skill-item" key={skill.name}>
                        {skill.name}
                    </li>
                ))}
            </ul>
        </section>
    );
}
