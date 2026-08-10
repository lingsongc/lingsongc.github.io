import { useState } from "react";

type ExperienceType = "experience" | "education";

export function Experience() {
    const [experienceType, setExperienceType] = useState<ExperienceType>("experience");

    return (
        <section
            id="experience"
            className="experience-container"
            aria-labelledby="experience-title"
        >
            <h2 id="experience-title" className="experience-title">
                Experience
            </h2>
            <aside className="experience-panel" aria-label="Experience timeline controls">
                <div className="experience-type-toggle" role="group" aria-label="Timeline type">
                    {(["experience", "education"] as const).map((type) => (
                        <button
                            className={`experience-type-button${experienceType === type
                                ? " experience-type-button-active"
                                : ""}`}
                            type="button"
                            aria-pressed={experienceType === type}
                            onClick={() => setExperienceType(type)}
                            key={type}
                        >
                            {type[0].toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </aside>
        </section>
    );
}
