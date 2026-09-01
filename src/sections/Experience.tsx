import { useEffect, useRef, useState } from "react";
import { IconBriefcase, IconCalendar, IconSchool } from "@tabler/icons-react";
import { education } from "../data/education";
import { experiences } from "../data/experiences";
import {
    alignMountedSectionAnchor,
    sectionRestingBounds,
} from "../motion/sectionTransitionBounds";
import { ExperienceOrbit } from "./ExperienceOrbit";

type ExperienceType = "experience" | "education";

const experienceEvents = experiences.map(({ id, organisation, role, ...event }) => ({
    id, title: organisation, subtitle: role, ...event,
}));
const educationEvents = education.map(({ id, institution, qualification, ...event }) => ({
    id, title: institution, subtitle: qualification, ...event,
}));
const eventsByType = { experience: experienceEvents, education: educationEvents };
const eventImagePath = (type: ExperienceType, id: string) => `/${type}/${id}.jpg`;
type ExperienceProps = {
    orbitLayerTarget: HTMLElement | null;
    onActiveEventChange: (image: string) => void;
    onVisibilityChange: (visible: boolean) => void;
};

export function Experience({ orbitLayerTarget, onActiveEventChange, onVisibilityChange }: ExperienceProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const [contentVisible, setContentVisible] = useState(false);
    const [orbitReady, setOrbitReady] = useState(false);
    const [experienceType, setExperienceType] = useState<ExperienceType>("experience");
    const [activeEventIds, setActiveEventIds] = useState({
        experience: experienceEvents[0].id,
        education: educationEvents[0].id,
    });
    const activeEvents = eventsByType[experienceType];
    const activeEvent = activeEvents.find(
        (event) => event.id === activeEventIds[experienceType],
    ) ?? activeEvents[0];
    const EventTypeIcon = experienceType === "experience" ? IconBriefcase : IconSchool;

    useEffect(() => {
        const section = sectionRef.current;
        const restingContainer = section?.parentElement;
        if (!section || !restingContainer) return;
        let contentVisible = false;
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY <= end;
            if (shouldShow === contentVisible) return;
            contentVisible = shouldShow;
            setContentVisible(shouldShow);
            onVisibilityChange(shouldShow);
            setOrbitReady(false);
            if (shouldShow && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                setOrbitReady(true);
            }
        };

        let alignmentFrame: number | undefined;
        const animationFrame = window.requestAnimationFrame(() => {
            alignmentFrame = window.requestAnimationFrame(() => {
                alignMountedSectionAnchor(restingContainer);
                updateContentVisibility();
            });
        });
        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.cancelAnimationFrame(alignmentFrame ?? 0);
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, []);

    const activateEvent = (index: number) => {
        const event = activeEvents[index];
        if (!event || event.id === activeEvent.id) return;
        setActiveEventIds((current) => ({ ...current, [experienceType]: event.id }));
        onActiveEventChange(eventImagePath(experienceType, event.id));
    };

    return (
        <section
            ref={sectionRef}
            className={`experience-container${contentVisible ? " experience-content-visible" : ""}${orbitReady ? " experience-orbit-ready" : ""}`}
            aria-labelledby="experience-title"
        >
            <div className="experience-copy">
                <header className="experience-header">
                    <div className="experience-header-content">
                        <h2 id="experience-title" className="experience-title">
                            {experienceType === "experience" ? "Experience" : "Education"}
                        </h2>
                        <div
                            className="experience-type-toggle"
                            data-active-type={experienceType}
                            role="group"
                            aria-label="Timeline type"
                        >
                            {(["experience", "education"] as const).map((type) => (
                                <button
                                    className={`experience-type-button${experienceType === type ? " experience-type-button-active" : ""}`}
                                    type="button"
                                    aria-pressed={experienceType === type}
                                    onClick={() => {
                                        if (type === experienceType) return;
                                        setExperienceType(type);
                                        onActiveEventChange(eventImagePath(type, activeEventIds[type]));
                                    }}
                                    key={type}
                                >
                                    {type[0].toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>
                <div className="experience-content-region">
                    <article className="experience-text">
                        <h3 className="experience-event-title">{activeEvent.title}</h3>
                        <div className="experience-event-metadata">
                            <p className="experience-metadata-item">
                                <EventTypeIcon className="experience-metadata-icon" stroke={1.75} aria-hidden="true" />
                                {activeEvent.subtitle}
                            </p>
                            <p className="experience-metadata-item">
                                <IconCalendar className="experience-metadata-icon" stroke={1.75} aria-hidden="true" />
                                {activeEvent.startDate} to {activeEvent.endDate}
                            </p>
                        </div>
                        <p className="experience-description">{activeEvent.description}</p>
                        <ul className="experience-highlights">
                            {activeEvent.highlights.map((highlight) => (
                                <li key={highlight}>
                                    <span className="experience-highlight-marker" aria-hidden="true" />
                                    <span>{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                </div>
            </div>
            <ExperienceOrbit
                activeEntryId={activeEvent.id}
                contentVisible={contentVisible}
                entries={activeEvents}
                imagePath={(id) => eventImagePath(experienceType, id)}
                interactive={orbitReady}
                label={experienceType}
                layerTarget={orbitLayerTarget}
                onEntrySelect={activateEvent}
                onReady={() => setOrbitReady(true)}
            />
        </section>
    );
}
