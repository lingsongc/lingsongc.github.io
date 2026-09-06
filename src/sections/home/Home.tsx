import { useEffect, useRef, type RefObject } from "react";
import { homeDetails } from "../../data/about";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";

const homeImage: ImageDescriptor = {
    src: "/about/profile.jpeg",
    alt: "",
    objectPosition: "center 55%",
};

type HomeProps = {
    sectionRef: RefObject<HTMLElement | null>;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Renders the Home introduction and publishes its image at the top of the page.
export function Home({ sectionRef, onMainCircleImageChange }: HomeProps) {
    const imageVisibleRef = useRef<boolean | null>(null);
    const leftName = homeDetails.name.isWestern
        ? homeDetails.name.firstName
        : homeDetails.name.lastName;
    const rightName = homeDetails.name.isWestern
        ? homeDetails.name.lastName
        : homeDetails.name.firstName;

    useEffect(() => {
        // Removes the Home image as soon as another section can take ownership.
        const updateImage = () => {
            const shouldShow = window.scrollY === 0;
            if (shouldShow === imageVisibleRef.current) return;
            imageVisibleRef.current = shouldShow;
            onMainCircleImageChange(shouldShow ? homeImage : null);
        };

        window.addEventListener("scroll", updateImage, { passive: true });
        updateImage();
        return () => window.removeEventListener("scroll", updateImage);
    }, [onMainCircleImageChange]);

    return (
        <section ref={sectionRef} id="home" className="home-container" aria-labelledby="home-title">
            <div className="orbit-ring home-navigation-ring" aria-hidden="true">
                {Array.from({ length: 6 }, (_, index) => (
                    <span className="home-navigation-exit-marker" key={index} />
                ))}
            </div>
            <div className="home-text">
                <h1 id="home-title" className="home-title" aria-label={homeDetails.name.fullName}>
                    <span className={`home-name-left ${homeDetails.name.isWestern ? "home-first-name" : ""}`} aria-hidden="true">
                        <span className="home-name-value">{leftName}</span>
                    </span>
                    <span className={`home-name-right ${homeDetails.name.isWestern ? "" : "home-first-name"}`} aria-hidden="true">
                        <span className="home-name-value">
                            {rightName.split(" ").map((name) => <span key={name}>{name}</span>)}
                        </span>
                    </span>
                </h1>
                <p className="visually-hidden">{homeDetails.introduction}</p>
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
