import { useEffect, useRef, type TransitionEvent } from "react";
import { aboutDetails } from "../../data/about";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";

const aboutImage: ImageDescriptor = {
    src: "/about/profile-2.jpg",
    alt: "",
    objectPosition: "center",
    transform: "translate(21%, -20%) scale(1.15)",
};

type AboutProps = {
    lifecycle: SceneLifecycleControl;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Reveals About exclusively from the explicit slideshow lifecycle.
export function About({ lifecycle, onMainCircleImageChange }: AboutProps) {
    const contentRef = useRef<HTMLDivElement>(null);
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    useEffect(() => {
        onMainCircleImageChange(aboutImage);
    }, [onMainCircleImageChange]);

    useEffect(() => {
        if (!lifecycle.active || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")) return;
        const content = contentRef.current;
        const hasTimedTransition = content
            ? getComputedStyle(content).transitionDuration
                .split(",")
                .some((duration) => Number.parseFloat(duration) > 0)
            : false;
        if (!content || hasTimedTransition) return;

        // A zero-duration transition has no transitionend event, so complete it immediately.
        lifecycle.onTransitionComplete(lifecycle.phase);
    }, [lifecycle]);

    // Reports completion only when About's owned seam transition actually finishes.
    const handleContentTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
        if (
            !lifecycle.active
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
