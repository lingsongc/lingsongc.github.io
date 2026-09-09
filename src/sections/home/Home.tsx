import { useEffect, useRef, type TransitionEvent } from "react";
import { homeDetails } from "../../data/about";
import type { ImageDescriptor, MainCircleImagePublisher } from "../../types/images";
import type { SceneLifecycleControl } from "../../types/scene";

const homeImage: ImageDescriptor = {
    src: "/about/profile.jpeg",
    alt: "",
    objectPosition: "center 55%",
};

type HomeProps = {
    lifecycle: SceneLifecycleControl;
    onMainCircleImageChange: MainCircleImagePublisher;
};

// Renders the Home introduction and publishes its image at the top of the page.
export function Home({ lifecycle, onMainCircleImageChange }: HomeProps) {
    const navigationRingRef = useRef<HTMLDivElement>(null);
    const leftName = homeDetails.name.isWestern
        ? homeDetails.name.firstName
        : homeDetails.name.lastName;
    const rightName = homeDetails.name.isWestern
        ? homeDetails.name.lastName
        : homeDetails.name.firstName;
    const contentVisible = lifecycle.active === true
        && (lifecycle.phase === "opening" || lifecycle.phase === "idle");
    const controlledExiting = !contentVisible;

    useEffect(() => {
        onMainCircleImageChange(homeImage);
    }, [onMainCircleImageChange]);

    useEffect(() => {
        if (!lifecycle.active || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")) return;
        const navigationRing = navigationRingRef.current;
        const hasTimedTransition = navigationRing
            ? getComputedStyle(navigationRing).transitionDuration
                .split(",")
                .some((duration) => Number.parseFloat(duration) > 0)
            : false;
        if (!navigationRing || hasTimedTransition) return;

        lifecycle.onTransitionComplete(lifecycle.phase);
    }, [lifecycle]);

    // Reports completion from the longest Home-owned transform transition.
    const handleHomeTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
        if (
            !lifecycle.active
            || event.target !== event.currentTarget
            || event.propertyName !== "transform"
            || (lifecycle.phase !== "opening" && lifecycle.phase !== "closing")
        ) return;

        lifecycle.onTransitionComplete(lifecycle.phase);
    };

    return (
        <section
            id="home"
            className={`home-container${controlledExiting ? " home-exiting" : ""}`}
            aria-labelledby="home-title"
        >
            <div
                ref={navigationRingRef}
                className="orbit-ring home-navigation-ring"
                aria-hidden="true"
                onTransitionEnd={handleHomeTransitionEnd}
            >
                {Array.from({ length: 6 }, (_, index) => (
                    <span className="home-navigation-exit-marker" key={index} />
                ))}
            </div>
            <div className="home-text">
                <h1 id="home-title" className="home-title" aria-label={homeDetails.name.fullName} tabIndex={-1}>
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
