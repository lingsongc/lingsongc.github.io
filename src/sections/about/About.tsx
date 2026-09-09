import { useEffect, useRef, useState, type RefObject, type TransitionEvent } from "react";
import { aboutDetails } from "../../data/about";
import { sectionRestingBounds } from "../../motion/sectionRestingBounds";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";

const aboutImage: ImageDescriptor = {
    src: "/about/profile-2.jpg",
    alt: "",
    objectPosition: "center",
    transform: "translate(21%, -20%) scale(1.15)",
};

type AboutProps = {
    lifecycle?: SceneLifecycleControl;
    restingContainerRef: RefObject<HTMLDivElement | null>;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Reveals About from explicit scene state while retaining the scroll-bound migration fallback.
export function About({ lifecycle, restingContainerRef, onMainCircleImageChange }: AboutProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const [fallbackContentVisible, setFallbackContentVisible] = useState(false);
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);
    const controlledContentVisible = lifecycle?.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");
    const controlled = lifecycle !== undefined;
    const contentVisible = controlled ? controlledContentVisible : fallbackContentVisible;

    useEffect(() => {
        if (lifecycle) return;
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;
        let currentVisibility = false;

        // Keeps the fallback content state aligned with the current resting bounds.
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY < end;
            if (shouldShow === currentVisibility) return;
            currentVisibility = shouldShow;
            setFallbackContentVisible(shouldShow);
        };

        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        updateContentVisibility();

        return () => {
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [lifecycle, restingContainerRef]);

    useEffect(() => {
        onMainCircleImageChange(controlled || contentVisible ? aboutImage : null);
    }, [contentVisible, controlled, onMainCircleImageChange]);

    useEffect(() => {
        if (!lifecycle?.active || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")) return;
        const content = contentRef.current;
        const hasTimedTransition = content
            ? getComputedStyle(content).transitionDuration
                .split(",")
                .some((duration) => Number.parseFloat(duration) > 0)
            : false;
        if (!content || hasTimedTransition) return;

        // A zero-duration transition has no transitionend event, so complete it immediately.
        lifecycle.onTransitionComplete(lifecycle.phase);
    }, [lifecycle?.onTransitionComplete, lifecycle?.phase]);

    // Reports completion only when About's owned seam transition actually finishes.
    const handleContentTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
        if (
            !lifecycle?.active
            || event.currentTarget !== event.target
            || event.propertyName !== "clip-path"
            || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")
        ) return;

        lifecycle.onTransitionComplete(lifecycle.phase);
    };

    return (
        <section
            className={`about-container${contentVisible ? " about-content-visible" : ""}`}
            aria-labelledby="about-title"
        >
            <div ref={contentRef} className="about-text" onTransitionEnd={handleContentTransitionEnd}>
                <h2 id="about-title" tabIndex={-1}>About Me</h2>
                <div className="about-description">
                    {paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph.trim()}</p>
                    ))}
                </div>
                <ul className="about-statistics" aria-label="About statistics">
                    {aboutDetails.statistics.map((statistic) => (
                        <li className="about-statistic" key={statistic.id}>
                            <strong className="about-statistic-amount">{statistic.amount}</strong>
                            <span className="body-copy">{statistic.detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
