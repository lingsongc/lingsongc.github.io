import { useEffect, useRef } from "react";
import { aboutDetails } from "../data/about";
import { sectionRestingBounds } from "../motion/sectionTransitionBounds";

export function About() {
    const sectionRef = useRef<HTMLElement>(null);
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);

    useEffect(() => {
        const section = sectionRef.current;
        const restingContainer = section?.parentElement;
        if (!section || !restingContainer) return;
        const updateContentVisibility = () => {
            const { start, end } = sectionRestingBounds(restingContainer);
            section.classList.toggle(
                "about-content-visible",
                window.scrollY >= start && window.scrollY < end,
            );
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
    }, []);

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
