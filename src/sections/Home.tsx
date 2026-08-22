import { homeDetails } from "../data/about";

export function Home() {
    const leftName = homeDetails.name.isWestern
        ? homeDetails.name.firstName
        : homeDetails.name.lastName;
    const rightName = homeDetails.name.isWestern
        ? homeDetails.name.lastName
        : homeDetails.name.firstName;

    return (
        <section id="home" className="home-container" aria-labelledby="home-title">
            <div className="orbit-ring home-navigation-ring" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                    <span className="home-navigation-exit-marker" key={index} />
                ))}
            </div>
            <div className="home-text">
                <h1 id="home-title" className="home-title" aria-label={homeDetails.name.fullName}>
                    <span className={`home-name-left ${homeDetails.name.isWestern ? "home-first-name" : ""}`} aria-hidden="true">{leftName}</span>
                    <span className={`home-name-right ${homeDetails.name.isWestern ? "" : "home-first-name"}`} aria-hidden="true">
                        {rightName.split(" ").map((name) => <span key={name}>{name}</span>)}
                    </span>
                </h1>
                <p className="home-description">{homeDetails.introduction}</p>
                <svg className="home-description-curve" viewBox="0 0 100 100" aria-hidden="true">
                    <defs>
                        <path id="home-description-path" d="M 0 50 A 50 50 0 0 0 100 50" />
                    </defs>
                    <text>
                        <textPath href="#home-description-path" startOffset="50%" textAnchor="middle">
                            {homeDetails.introduction}
                        </textPath>
                    </text>
                </svg>
            </div>
        </section>
    );
}
