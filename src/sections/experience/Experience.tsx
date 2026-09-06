import { useEffect, useRef, useState, type RefObject } from "react";
import { IconBriefcase, IconCalendar, IconSchool } from "@tabler/icons-react";
import { education } from "../../data/education";
import { experiences } from "../../data/experiences";
import { sectionRestingBounds } from "../../motion/sectionRestingBounds";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import { ExperienceOrbit } from "./ExperienceOrbit";

type ExperienceType = "experience" | "education";

const experienceEvents = experiences.map(({ id, organisation, role, ...event }) => ({
    id, title: organisation, subtitle: role, ...event,
}));
const educationEvents = education.map(({ id, institution, qualification, ...event }) => ({
    id, title: institution, subtitle: qualification, ...event,
}));
const eventsByType = { experience: experienceEvents, education: educationEvents };
type ExperienceProps = {
    restingContainerRef: RefObject<HTMLDivElement | null>;
    orbitRef: RefObject<HTMLElement | null>;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Coordinates the shared Experience and Education timeline, content, and image.
export function Experience({ restingContainerRef, orbitRef, onMainCircleImageChange }: ExperienceProps) {
    const imageVisibleRef = useRef(false);
    const activeImageRef = useRef<ImageDescriptor | null>(null);
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
    activeImageRef.current = eventImage(experienceType, activeEvent.id);
    const EventTypeIcon = experienceType === "experience" ? IconBriefcase : IconSchool;

    useEffect(() => {
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;
        let contentVisible = false;

        // Keeps timeline visibility and its main-circle image aligned with scrolling.
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY <= end;
            if (shouldShow === contentVisible) return;
            contentVisible = shouldShow;
            imageVisibleRef.current = shouldShow;
            setContentVisible(shouldShow);
            onMainCircleImageChange(shouldShow ? activeImageRef.current : null);
            setOrbitReady(false);
            if (shouldShow && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                setOrbitReady(true);
            }
        };

        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        updateContentVisibility();
        return () => {
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [onMainCircleImageChange, restingContainerRef]);

    // Selects a timeline event while preserving each timeline's last selection.
    const activateEvent = (index: number) => {
        const event = activeEvents[index];
        if (!event || event.id === activeEvent.id) return;
        setActiveEventIds((current) => ({ ...current, [experienceType]: event.id }));
        if (imageVisibleRef.current) onMainCircleImageChange(eventImage(experienceType, event.id));
    };

    return (
        <section
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
                                        if (imageVisibleRef.current) onMainCircleImageChange(eventImage(type, activeEventIds[type]));
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
                                <EventTypeIcon className="experience-metadata-icon" aria-hidden="true" />
                                {activeEvent.subtitle}
                            </p>
                            <p className="experience-metadata-item">
                                <IconCalendar className="experience-metadata-icon" aria-hidden="true" />
                                {activeEvent.startDate} to {activeEvent.endDate}
                            </p>
                        </div>
                        <p className="experience-description">{activeEvent.description}</p>
                        <ul className="experience-highlights body-copy">
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
                orbitRef={orbitRef}
                onEntrySelect={activateEvent}
                onReady={() => setOrbitReady(true)}
            />
        </section>
    );
}

// Builds the public image path for a timeline entry.
function eventImagePath(type: ExperienceType, id: string) {
    return `/${type}/${id}.jpg`;
}

// Creates the image data published to the main circle.
function eventImage(type: ExperienceType, id: string): ImageDescriptor {
    return {
        src: eventImagePath(type, id),
        alt: "",
        objectPosition: "center",
    };
}
