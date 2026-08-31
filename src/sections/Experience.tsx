import { useEffect, useRef, useState, type CSSProperties } from "react";
import { IconBriefcase, IconCalendar, IconSchool } from "@tabler/icons-react";
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
const eventImagePath = (type: ExperienceType, id: string) => `/${type}/${id}.jpg`;
const orbitScrollStep = 112;
const orbitAngleStep = 36;
const orbitFocusAngle = -36;

type ExperienceProps = {
    onActiveEventChange: (image: string) => void;
};

export function Experience({ onActiveEventChange }: ExperienceProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const orbitScrollRef = useRef<HTMLDivElement>(null);
    const orbitInteractiveRef = useRef(false);
    const orbitTargetIndexRef = useRef(0);
    const activateEventRef = useRef<(index: number) => void>(() => undefined);
    const selectEventRef = useRef<(index: number) => void>(() => undefined);
    const [contentVisible, setContentVisible] = useState(false);
    const [orbitReady, setOrbitReady] = useState(false);
    const [experienceType, setExperienceType] = useState<ExperienceType>("experience");
    const [orbitPosition, setOrbitPosition] = useState(0);
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
        let orbitReadyTimer: number | undefined;
        const setOrbitInteractive = (interactive: boolean) => {
            orbitInteractiveRef.current = interactive;
            setOrbitReady(interactive);
        };
        const updateContentVisibility = () => {
            const start = restingContainer.getBoundingClientRect().top + window.scrollY;
            const end = start + restingContainer.offsetHeight - window.innerHeight;
            const shouldShow = window.scrollY >= start && window.scrollY < end;
            if (shouldShow === contentVisible) return;
            contentVisible = shouldShow;
            setContentVisible(shouldShow);
            window.clearTimeout(orbitReadyTimer);
            setOrbitInteractive(false);
            if (shouldShow) {
                const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 500;
                orbitReadyTimer = window.setTimeout(() => setOrbitInteractive(contentVisible), delay);
            }
        };

        const animationFrame = window.requestAnimationFrame(updateContentVisibility);
        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.clearTimeout(orbitReadyTimer);
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
            setOrbitInteractive(false);
        };
    }, []);

    useEffect(() => {
        const activeIndex = activeEvents.findIndex(
            (event) => event.id === activeEventIds[experienceType],
        );
        const nextPosition = Math.max(0, activeIndex);
        orbitTargetIndexRef.current = nextPosition;
        orbitScrollRef.current?.scrollTo({ top: nextPosition * orbitScrollStep });
        setOrbitPosition(nextPosition);
    }, [experienceType]);

    const activateEvent = (index: number) => {
        const event = activeEvents[index];
        if (!event || event.id === activeEvent.id) return;
        setActiveEventIds((current) => ({ ...current, [experienceType]: event.id }));
        onActiveEventChange(eventImagePath(experienceType, event.id));
    };
    activateEventRef.current = activateEvent;

    const selectEvent = (index: number, behavior?: ScrollBehavior) => {
        if (!orbitInteractiveRef.current) return;
        const event = activeEvents[index];
        if (!event) return;
        orbitTargetIndexRef.current = index;
        activateEvent(index);
        const scrollBehavior = behavior ?? (window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth");
        orbitScrollRef.current?.scrollTo({ top: index * orbitScrollStep, behavior: scrollBehavior });
    };
    selectEventRef.current = selectEvent;

    useEffect(() => {
        const scrollArea = orbitScrollRef.current;
        if (!scrollArea) return;
        const handleWheel = (event: WheelEvent) => {
            if (!orbitInteractiveRef.current) return;
            if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            const direction = event.deltaY < 0 ? -1 : 1;
            const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scrollArea.clientHeight : 1;
            const normalizedDelta = event.deltaY * deltaScale;
            const atBoundary = direction < 0
                ? orbitTargetIndexRef.current === 0
                : orbitTargetIndexRef.current === activeEvents.length - 1;
            if (atBoundary) {
                event.preventDefault();
                window.scrollBy({ top: normalizedDelta });
                return;
            }
            event.preventDefault();
            selectEventRef.current(orbitTargetIndexRef.current + direction);
        };
        const syncTargetIndex = () => {
            if (!orbitInteractiveRef.current) return;
            const nextIndex = Math.round(scrollArea.scrollTop / orbitScrollStep);
            orbitTargetIndexRef.current = nextIndex;
            activateEventRef.current(nextIndex);
        };
        scrollArea.addEventListener("wheel", handleWheel, { passive: false });
        scrollArea.addEventListener("scrollend", syncTargetIndex);
        return () => {
            scrollArea.removeEventListener("wheel", handleWheel);
            scrollArea.removeEventListener("scrollend", syncTargetIndex);
        };
    }, [activeEvents.length]);

    const handleOrbitScroll = () => {
        const nextPosition = (orbitScrollRef.current?.scrollTop ?? 0) / orbitScrollStep;
        setOrbitPosition(nextPosition);
    };

    return (
        <section
            ref={sectionRef}
            id="experience"
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
            <aside className="experience-orbit" aria-label={`${experienceType} entries`}>
                <div
                    ref={orbitScrollRef}
                    className="experience-orbit-scroll"
                    onScroll={handleOrbitScroll}
                    onKeyDown={(event) => {
                        if (!orbitInteractiveRef.current) return;
                        if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
                        event.preventDefault();
                        const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
                        selectEvent(Math.round(orbitPosition) + direction);
                    }}
                    tabIndex={0}
                    aria-label={`Scroll through ${experienceType} entries`}
                >
                    <div
                        className="experience-orbit-track"
                        style={{ "--experience-scroll-distance": `${(activeEvents.length - 1) * orbitScrollStep}px` } as CSSProperties}
                    >
                        <div className="experience-orbit-stage">
                            <span className="orbit-ring experience-orbit-ring" aria-hidden="true" />
                            <ol className="experience-event-orbit-list">
                                {activeEvents.map((event, index) => {
                                    const angle = orbitFocusAngle - (index - orbitPosition) * orbitAngleStep;
                                    const visible = angle >= -160 && angle <= 45;
                                    return (
                                        <li
                                            className={`experience-event-orbit-item${visible ? "" : " experience-event-orbit-item-hidden"}`}
                                            style={{
                                                "--experience-event-angle": `${angle}deg`,
                                                "--experience-event-angle-inverse": `${-angle}deg`,
                                            } as CSSProperties}
                                            key={event.id}
                                        >
                                            <button
                                                className="experience-event-button"
                                                type="button"
                                                aria-label={event.title}
                                                aria-pressed={activeEvent.id === event.id}
                                                tabIndex={visible ? 0 : -1}
                                                onClick={() => selectEvent(index)}
                                            >
                                                <img className="experience-event-image" src={eventImagePath(experienceType, event.id)} alt="" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                            <span
                                className="experience-orbit-focus-marker"
                                style={{
                                    "--experience-event-angle": `${orbitFocusAngle}deg`,
                                    "--experience-event-angle-inverse": `${-orbitFocusAngle}deg`,
                                } as CSSProperties}
                                aria-hidden="true"
                            />
                        </div>
                        {activeEvents.map((event, index) => (
                            <span
                                className="experience-orbit-snap-point"
                                style={{ top: index * orbitScrollStep }}
                                aria-hidden="true"
                                key={event.id}
                            />
                        ))}
                    </div>
                </div>
            </aside>
        </section>
    );
}
