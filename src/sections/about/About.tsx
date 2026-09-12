import { useEffect } from "react";
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
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    useEffect(() => {
        onMainCircleImageChange(aboutImage);
    }, [onMainCircleImageChange]);

    return (
        <section
            className={`about-container${contentVisible ? " about-content-visible" : ""}`}
            aria-labelledby="about-title"
        >
            <div className="about-text">
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
