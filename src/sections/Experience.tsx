import { useState } from "react";
import { education } from "../data/education";
import { experiences } from "../data/experiences";

type ExperienceType = "experience" | "education";

const experienceEvents = experiences.map(({ id, organisation, role, ...event }) => ({
    id, title: organisation, subtitle: role, ...event,
}));
const educationEvents = education.map(({ id, institution, qualification, ...event }) => ({
    id, title: institution, subtitle: qualification, ...event,
}));
const eventsByType = { experience: experienceEvents, education: educationEvents };

type ExperienceProps = {
    onActiveEventChange: (image: string) => void;
};

export function Experience({ onActiveEventChange }: ExperienceProps) {
    const [experienceType, setExperienceType] = useState<ExperienceType>("experience");
    const [activeEventIds, setActiveEventIds] = useState({
        experience: experienceEvents[0].id,
        education: educationEvents[0].id,
    });
    const activeEvent = eventsByType[experienceType].find(
        (event) => event.id === activeEventIds[experienceType],
    ) ?? eventsByType[experienceType][0];

    return (
        <section
            id="experience"
            className="experience-container"
            aria-labelledby="experience-title"
        >
            <article className="experience-text">
                <h2 id="experience-title" className="experience-title">
                    {experienceType === "experience" ? "Experience" : "Education"}
                </h2>
                <h3 className="experience-event-title">{activeEvent.title}</h3>
                <p className="experience-role">{activeEvent.subtitle}</p>
                <p className="experience-dates">{activeEvent.startDate} to {activeEvent.endDate}</p>
                <p className="experience-description">{activeEvent.description}</p>
                <ul className="experience-highlights">
                    {activeEvent.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
                </ul>
            </article>
            <aside className="experience-panel" aria-label="Experience timeline controls">
                <div className="experience-type-toggle" role="group" aria-label="Timeline type">
                    {(["experience", "education"] as const).map((type) => (
                        <button
                            className={`experience-type-button${experienceType === type
                                ? " experience-type-button-active"
                                : ""}`}
                            type="button"
                            aria-pressed={experienceType === type}
                            onClick={() => {
                                setExperienceType(type);
                                onActiveEventChange(`/${activeEventIds[type]}.jpg`);
                            }}
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
                                    aria-label={event.title}
                                    aria-pressed={activeEventIds[type] === event.id}
                                    onClick={() => {
                                        setActiveEventIds((current) => ({ ...current, [type]: event.id }));
                                        onActiveEventChange(`/${event.id}.jpg`);
                                    }}
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
