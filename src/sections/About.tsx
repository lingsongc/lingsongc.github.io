import { aboutDetails } from "../data/about";

export function About() {
    const paragraphs = aboutDetails.description.trim().split(/\n\s*\n/);

    return (
        <section id="about" className="about-container" aria-labelledby="about-title">
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
