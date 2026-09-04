import { useEffect, type RefObject } from "react";
import { aboutDetails } from "../data/about";
import { sectionRestingBounds } from "../motion/sectionRestingBounds";
import type { ImageDescriptor } from "../types/images";

const aboutImage: ImageDescriptor = {
    src: "/about/profile-2.jpg",
    alt: "",
    objectPosition: "center",
    transform: "translate(21%, -20%) scale(1.15)",
};

type AboutProps = {
    sectionRef: RefObject<HTMLElement | null>;
    onMainCircleImageChange: (image: ImageDescriptor | null) => void;
};

export function About({ sectionRef, onMainCircleImageChange }: AboutProps) {
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);

    useEffect(() => {
        const section = sectionRef.current;
        const restingContainer = section?.parentElement;
        if (!section || !restingContainer) return;
        let imageVisible = false;
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            const shouldShow = window.scrollY >= start && window.scrollY < end;
            section.classList.toggle(
                "about-content-visible",
                shouldShow,
            );
            if (shouldShow === imageVisible) return;
            imageVisible = shouldShow;
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
            section.classList.remove("about-content-visible");
        };
    }, [onMainCircleImageChange]);

    return (
        <section ref={sectionRef} id="about" className="about-container" aria-labelledby="about-title">
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
