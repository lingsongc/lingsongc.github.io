import { useState } from "react";
import { education } from "../data/education";
import { experiences } from "../data/experiences";

type ExperienceType = "experience" | "education";

const experienceEvents = experiences.map(({ id, organisation }) => ({ id, label: organisation }));
const educationEvents = education.map(({ id, institution }) => ({ id, label: institution }));
const eventsByType = { experience: experienceEvents, education: educationEvents };

export function Experience() {
    const [experienceType, setExperienceType] = useState<ExperienceType>("experience");
    const [activeEventIds, setActiveEventIds] = useState({
        experience: experienceEvents[0].id,
        education: educationEvents[0].id,
    });

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
                {(["experience", "education"] as const).map((type) => (
                    <ol
                        className="experience-event-list"
                        aria-label={`${type[0].toUpperCase() + type.slice(1)} entries`}
                        hidden={experienceType !== type}
                        key={type}
                    >
                        {eventsByType[type].map((event) => (
                            <li key={event.id}>
                                <button
                                    className={`experience-event-button${activeEventIds[type] === event.id
                                        ? " experience-event-button-active"
                                        : ""}`}
                                    type="button"
                                    aria-label={event.label}
                                    aria-pressed={activeEventIds[type] === event.id}
                                    onClick={() => setActiveEventIds((current) => ({
                                        ...current,
                                        [type]: event.id,
                                    }))}
                                >
                                    <img className="experience-event-image" src={`/${event.id}.jpg`} alt="" />
                                </button>
                            </li>
                        ))}
                    </ol>
                ))}
            </aside>
        </section>
    );
}
