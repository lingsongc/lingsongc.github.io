import { useEffect, useState, type RefObject } from "react";
import { aboutDetails } from "../../data/about";
import { sectionRestingBounds } from "../../motion/sectionRestingBounds";
import type { ImageDescriptor } from "../../types/images";

const aboutImage: ImageDescriptor = {
    src: "/about/profile-2.jpg",
    alt: "",
    objectPosition: "center",
    transform: "translate(21%, -20%) scale(1.15)",
};

type AboutProps = {
    restingContainerRef: RefObject<HTMLDivElement | null>;
    onMainCircleImageChange: (image: ImageDescriptor | null) => void;
};

export function About({ restingContainerRef, onMainCircleImageChange }: AboutProps) {
    const [contentVisible, setContentVisible] = useState(false);
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);

    useEffect(() => {
        const restingContainer = restingContainerRef.current;
        if (!restingContainer) return;
        let currentVisibility = false;

        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY < end;
            if (shouldShow === currentVisibility) return;
            currentVisibility = shouldShow;
            setContentVisible(shouldShow);
            onMainCircleImageChange(shouldShow ? aboutImage : null);
        };

        const animationFrame = window.requestAnimationFrame(updateContentVisibility);
        window.addEventListener("scroll", updateContentVisibility, { passive: true });
        window.addEventListener("resize", updateContentVisibility);
        updateContentVisibility();

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("scroll", updateContentVisibility);
            window.removeEventListener("resize", updateContentVisibility);
        };
    }, [onMainCircleImageChange, restingContainerRef]);

    return (
        <section
            id="about"
            className={`about-container${contentVisible ? " about-content-visible" : ""}`}
            aria-labelledby="about-title"
        >
            <div className="about-text">
                <h2 id="about-title" className="about-title">About Me</h2>
                <div className="about-description">
                    {paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph.trim()}</p>
                    ))}
                </div>
                <ul className="about-statistics" aria-label="About statistics">
                    {aboutDetails.statistics.map((statistic) => (
                        <li className="about-statistic" key={statistic.id}>
                            <strong className="about-statistic-amount">{statistic.amount}</strong>
                            <span className="about-statistic-detail">{statistic.detail}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
