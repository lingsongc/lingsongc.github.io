import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { IconMouse } from "@tabler/icons-react";
import {
    experienceOrbitGeometry,
    experienceOrbitFrontPath,
    experienceOrbitLayerStyles,
    experienceOrbitPoint,
    experienceOrbitPointIsVisible,
    experienceOrbitSectionStyles,
    experienceOrbitViewBox,
} from "./experienceOrbitGeometry";

export type ExperienceOrbitEntry = { id: string; title: string };

type ExperienceOrbitProps = {
    activeEntryId: string;
    contentVisible: boolean;
    entries: readonly ExperienceOrbitEntry[];
    imagePath: (id: string) => string;
    interactive: boolean;
    label: string;
    orbitRef: RefObject<HTMLElement | null>;
    onEntrySelect: (index: number) => void;
    onReady: () => void;
};

// Renders and controls the circular selector for timeline entries.
export function ExperienceOrbit({
    activeEntryId,
    contentVisible,
    entries,
    imagePath,
    interactive,
    label,
    orbitRef,
    onEntrySelect,
    onReady,
}: ExperienceOrbitProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const interactiveRef = useRef(interactive);
    const targetIndexRef = useRef(0);
    const activateRef = useRef(onEntrySelect);
    const selectRef = useRef<(index: number) => void>(() => undefined);
    const [position, setPosition] = useState(0);
    const [selectorFocused, setSelectorFocused] = useState(false);
    const [selectorHovered, setSelectorHovered] = useState(false);
    interactiveRef.current = interactive;
    activateRef.current = onEntrySelect;

    // Activates an entry and scrolls its hidden snap area to the same position.
    const selectEntry = (index: number) => {
        if (!interactiveRef.current || !entries[index]) return;
        targetIndexRef.current = index;
        activateRef.current(index);
        const scrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
        scrollRef.current?.scrollTo({ top: index * experienceOrbitGeometry.scrollStep, behavior: scrollBehavior });
    };
    selectRef.current = selectEntry;

    useEffect(() => {
        const activeIndex = Math.max(0, entries.findIndex((entry) => entry.id === activeEntryId));
        targetIndexRef.current = activeIndex;
        scrollRef.current?.scrollTo({ top: activeIndex * experienceOrbitGeometry.scrollStep });
        setPosition(activeIndex);
    }, [entries]);

    useEffect(() => {
        const scrollArea = scrollRef.current;
        if (!scrollArea) return;
        // Moves between entries, then returns wheel control to the page at either end.
        const handleWheel = (event: WheelEvent) => {
            if (!interactiveRef.current || event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
            const direction = event.deltaY < 0 ? -1 : 1;
            const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? scrollArea.clientHeight : 1;
            const atBoundary = direction < 0 ? targetIndexRef.current === 0 : targetIndexRef.current === entries.length - 1;
            event.preventDefault();
            if (atBoundary) {
                window.scrollBy({ top: event.deltaY * deltaScale });
                return;
            }
            selectRef.current(targetIndexRef.current + direction);
        };
        // Selects the nearest entry after native scrolling finishes.
        const syncTargetIndex = () => {
            if (!interactiveRef.current) return;
            const nextIndex = Math.round(scrollArea.scrollTop / experienceOrbitGeometry.scrollStep);
            targetIndexRef.current = nextIndex;
            activateRef.current(nextIndex);
        };
        scrollArea.addEventListener("wheel", handleWheel, { passive: false });
        scrollArea.addEventListener("scrollend", syncTargetIndex);
        return () => {
            scrollArea.removeEventListener("wheel", handleWheel);
            scrollArea.removeEventListener("scrollend", syncTargetIndex);
        };
    }, [entries.length]);

    // Rendering this layer at page level lets planets pass in front of the main circle.
    const planetLayer = (
        <div
            className={`experience-orbit-planets${contentVisible ? " experience-orbit-planets-visible" : ""}${interactive ? " experience-orbit-planets-ready" : ""}`}
            style={experienceOrbitLayerStyles}
            onTransitionEnd={(event) => {
                if (event.target === event.currentTarget && event.propertyName === "transform" && contentVisible) onReady();
            }}
        >
            <ol className="experience-event-orbit-list" aria-label={`${label} entries`}>
                {entries.map((entry, index) => {
                    const angle = experienceOrbitGeometry.focusAngle - (index - position) * experienceOrbitGeometry.angleStep;
                    const visible = experienceOrbitPointIsVisible(angle);
                    return (
                        <li className={`experience-event-orbit-item${visible ? "" : " experience-event-orbit-item-hidden"}`} style={experienceOrbitPoint(angle)} key={entry.id}>
                            <button className="experience-event-button" type="button" aria-label={entry.title} aria-pressed={activeEntryId === entry.id} tabIndex={visible && interactive ? 0 : -1} onClick={() => selectEntry(index)}>
                                <img className="experience-event-image" src={imagePath(entry.id)} alt="" />
                            </button>
                        </li>
                    );
                })}
            </ol>
            <span className="experience-orbit-focus-marker" style={experienceOrbitPoint(experienceOrbitGeometry.focusAngle)} aria-hidden="true" />
        </div>
    );

    return (
        <>
            <aside ref={orbitRef} className="experience-orbit" aria-label={`${label} entries`}>
                <svg className="experience-orbit-ring" viewBox={experienceOrbitViewBox} style={experienceOrbitSectionStyles} aria-hidden="true">
                    <ellipse className="experience-orbit-path" cx={experienceOrbitGeometry.viewBoxWidth / 2} cy={experienceOrbitGeometry.viewBoxHeight / 2} rx={experienceOrbitGeometry.radiusX} ry={experienceOrbitGeometry.radiusY} />
                </svg>
                <div
                    ref={scrollRef}
                    className="experience-orbit-scroll"
                    onScroll={() => setPosition((scrollRef.current?.scrollTop ?? 0) / experienceOrbitGeometry.scrollStep)}
                    onMouseEnter={() => setSelectorHovered(true)}
                    onMouseLeave={() => setSelectorHovered(false)}
                    onFocus={() => setSelectorFocused(true)}
                    onBlur={() => setSelectorFocused(false)}
                    onKeyDown={(event) => {
                        if (!interactiveRef.current || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
                        const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
                        const nextIndex = targetIndexRef.current + direction;
                        if (nextIndex < 0 || nextIndex >= entries.length) return;
                        event.preventDefault();
                        selectEntry(nextIndex);
                    }}
                    tabIndex={interactive ? 0 : -1}
                    aria-label={`Scroll through ${label} entries`}
                >
                    <div className="experience-orbit-track" style={{ "--experience-scroll-distance": `${(entries.length - 1) * experienceOrbitGeometry.scrollStep}px` } as CSSProperties}>
                        {entries.map((entry, index) => (
                            <span className="experience-orbit-snap-point" style={{ top: index * experienceOrbitGeometry.scrollStep }} aria-hidden="true" key={entry.id} />
                        ))}
                    </div>
                </div>
            </aside>
            {createPortal(
                <div className={`experience-orbit-foreground${contentVisible ? " experience-orbit-foreground-visible" : ""}`}>
                    <div className="experience-orbit-front" aria-hidden="true">
                        <svg className="experience-orbit-front-path" viewBox={experienceOrbitViewBox} style={experienceOrbitLayerStyles}>
                            <path className="experience-orbit-path" d={experienceOrbitFrontPath} />
                        </svg>
                    </div>
                    {planetLayer}
                    <span
                        className={`experience-orbit-scroll-indicator${interactive && (selectorHovered || selectorFocused) ? " experience-orbit-scroll-indicator-visible" : ""}`}
                        aria-hidden="true"
                    >
                        <IconMouse />
                    </span>
                </div>,
                document.body,
            )}
        </>
    );
}
