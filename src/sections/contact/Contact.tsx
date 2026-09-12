import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { SceneLifecycleControl } from "../../types/scene";
import { contactFittedFinalOffset, contactInitialOffset } from "./contactGeometry";

type ContactProps = { lifecycle: SceneLifecycleControl };
type ContactProfile = typeof contactProfiles[number];
type ProfileStyle = CSSProperties & {
    "--contact-initial-x": string;
    "--contact-initial-y": string;
    "--contact-final-x": string;
    "--contact-final-y": string;
};

const contactProfiles = [
    { id: "github", label: "GitHub", href: "https://github.com/lingsongc", offset: [-0.78, 0.26], diameterRatio: 0.36 },
    { id: "instagram", label: "Instagram", href: "https://www.instagram.com/lingsongc/", offset: [-0.62, -0.58], diameterRatio: 0.28 },
    { id: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/lingsongc/", offset: [0.78, -0.28], diameterRatio: 0.31 },
] as const;

// Renders Contact with measured CSS offsets for its gooey profile split.
export function Contact({ lifecycle }: ContactProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const [layout, setLayout] = useState({ orbitSize: 0, viewportWidth: 0, viewportHeight: 0 });
    const visible = lifecycle.active && (lifecycle.phase === "opening" || lifecycle.phase === "idle");

    useLayoutEffect(() => {
        const orbit = orbitRef.current;
        if (!orbit) return;
        const measure = () => setLayout({
            orbitSize: orbit.offsetWidth,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        });
        const observer = new ResizeObserver(measure);
        observer.observe(orbit);
        measure();
        return () => observer.disconnect();
    }, []);

    return (
        <section id="contact" className="contact-container" aria-labelledby="contact-title">
            <div ref={orbitRef} className={`contact-orbit${visible ? " contact-split-visible" : ""}`}>
                <svg width="0" height="0" aria-hidden="true">
                    <defs>
                        <filter id="contact-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="contact-blur" />
                            <feColorMatrix in="contact-blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="contact-goo-alpha" />
                            <feBlend in="SourceGraphic" in2="contact-goo-alpha" />
                        </filter>
                    </defs>
                </svg>
                <div className="contact-blob-layer" aria-hidden="true">
                    <span className="contact-blob-center" />
                    {contactProfiles.map((profile) => (
                        <span className="contact-satellite" style={profileStyle(profile, layout)} key={profile.id} />
                    ))}
                </div>
                <nav className="contact-link-layer" aria-label="Social profiles">
                    {contactProfiles.map((profile) => (
                        <a className="contact-link" href={profile.href} style={profileStyle(profile, layout)} key={profile.id}>
                            {profile.label}
                        </a>
                    ))}
                </nav>
            </div>
            <div className="contact-content">
                <h2 id="contact-title" tabIndex={-1}>Contact</h2>
                <p className="contact-description">Have a project in mind?</p>
                <a className="contact-action" href="mailto:lingsong.c4@gmail.com">Send me an email</a>
            </div>
        </section>
    );
}

// Publishes the measured start and fitted endpoint as CSS variables.
function profileStyle(profile: ContactProfile, layout: { orbitSize: number; viewportWidth: number; viewportHeight: number }): ProfileStyle {
    const { orbitSize, viewportWidth, viewportHeight } = layout;
    return {
        width: `${profile.diameterRatio * 100}%`,
        "--contact-initial-x": `${contactInitialOffset(profile.offset, profile.diameterRatio, orbitSize, 0)}px`,
        "--contact-initial-y": `${contactInitialOffset(profile.offset, profile.diameterRatio, orbitSize, 1)}px`,
        "--contact-final-x": `${contactFittedFinalOffset(profile.offset, profile.diameterRatio, orbitSize, viewportWidth, viewportHeight, 0)}px`,
        "--contact-final-y": `${contactFittedFinalOffset(profile.offset, profile.diameterRatio, orbitSize, viewportWidth, viewportHeight, 1)}px`,
    };
}
