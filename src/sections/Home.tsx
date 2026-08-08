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
            <div className="home-text">
                <h1 id="home-title" className="home-title">
                    <span className="home-name-left">{leftName}</span>
                    <span className="home-name-right">{rightName}</span>
                </h1>
                <p className="home-description">{homeDetails.introduction}</p>
            </div>
        </section>
    );
}
