import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { SceneLifecycleControl } from "../../types/scene";
import { contactFittedFinalOffset, contactInitialOffset } from "./contactGeometry";

gsap.registerPlugin(useGSAP);

type ContactProps = {
    lifecycle: SceneLifecycleControl;
};

const contactProfiles = [
    {
        id: "github",
        label: "GitHub",
        href: "https://github.com/lingsongc",
        offset: [-0.78, 0.26],
        diameterRatio: 0.36,
    },
    {
        id: "instagram",
        label: "Instagram",
        href: "https://www.instagram.com/lingsongc/",
        offset: [-0.62, -0.58],
        diameterRatio: 0.28,
    },
    {
        id: "linkedin",
        label: "LinkedIn",
        href: "https://www.linkedin.com/in/lingsongc/",
        offset: [0.78, -0.28],
        diameterRatio: 0.31,
    },
] as const;

const contactProfilesById = new Map(contactProfiles.map((profile) => [profile.id, profile]));

// Renders Contact content and animates its profile links out from the main circle.
export function Contact({ lifecycle }: ContactProps) {
    const sectionRef = useRef<HTMLElement>(null);
    const orbitRef = useRef<HTMLDivElement>(null);
    const blobLayerRef = useRef<HTMLDivElement>(null);
    const linkLayerRef = useRef<HTMLElement>(null);
    const satelliteRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
    const splitTimelineRef = useRef<gsap.core.Timeline | null>(null);
    const lifecycleRef = useRef(lifecycle);
    lifecycleRef.current = lifecycle;

    useGSAP(() => {
        const section = sectionRef.current;
        const orbit = orbitRef.current;
        const blobLayer = blobLayerRef.current;
        const linkLayer = linkLayerRef.current;
        if (!section || !orbit || !blobLayer || !linkLayer) return;

        const splitElements = [...satelliteRefs.current, ...linkRefs.current]
            .filter((element): element is HTMLElement => element !== null);
        // Finds the shared profile settings for a rendered link or shape.
        const contactProfile = (element: HTMLElement) => (
            contactProfilesById.get(element.dataset.contactLink as typeof contactProfiles[number]["id"])
        );
        
        // Calculates a rendered profile's final offset from the orbit center.
        const profileFinalOffset = (element: HTMLElement, axis: 0 | 1) => {
            const profile = contactProfile(element);
            return contactFittedFinalOffset(
                profile?.offset ?? [0, 0],
                profile?.diameterRatio ?? 0,
                orbit.offsetWidth,
                window.innerWidth,
                window.innerHeight,
                axis,
            );
        };
        
        // Calculates a rendered profile's starting position inside the circle.
        const profileInitialOffset = (element: HTMLElement, axis: 0 | 1) => {
            const profile = contactProfile(element);
            return contactInitialOffset(
                profile?.offset ?? [0, 0],
                profile?.diameterRatio ?? 0,
                orbit.offsetWidth,
                axis,
            );
        };

        gsap.set([blobLayer, linkLayer], { autoAlpha: 0 });
        gsap.set(splitElements, {
            xPercent: -50,
            yPercent: -50,
            x: (_, element: HTMLElement) => profileInitialOffset(element, 0),
            y: (_, element: HTMLElement) => profileInitialOffset(element, 1),
            scale: 1,
        });
        const splitTimeline = gsap.timeline({
            paused: true,
            onComplete: () => {
                const currentLifecycle = lifecycleRef.current;
                if (currentLifecycle?.phase === "opening") {
                    currentLifecycle.onTransitionComplete("opening");
                }
            },
            onReverseComplete: () => {
                const currentLifecycle = lifecycleRef.current;
                if (currentLifecycle?.phase === "closing") {
                    currentLifecycle.onTransitionComplete("closing");
                }
            },
        })
            .to(blobLayer, { autoAlpha: 1, duration: 0.06 }, 0)
            .to(splitElements, {
                x: (_, element: HTMLElement) => profileFinalOffset(element, 0),
                y: (_, element: HTMLElement) => profileFinalOffset(element, 1),
                duration: 0.5,
                ease: "power2.inOut",
            }, 0)
            .to(linkLayer, { autoAlpha: 1, duration: 0.12 }, 0.38);

        splitTimelineRef.current = splitTimeline;
        return () => {
            splitTimeline.kill();
            splitTimelineRef.current = null;
        };
    }, {
        scope: sectionRef,
        dependencies: [],
        revertOnUpdate: true,
    });

    useEffect(() => {
        const splitTimeline = splitTimelineRef.current;
        if (!splitTimeline) return;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        if (lifecycle.active && lifecycle.phase === "idle") {
            splitTimeline.progress(1, true).pause();
        } else if (lifecycle.active && lifecycle.phase === "opening") {
            if (reducedMotion) {
                splitTimeline.progress(1, true).pause();
                lifecycle.onTransitionComplete("opening");
            } else {
                splitTimeline.play();
            }
        } else if (lifecycle.active && lifecycle.phase === "closing") {
            if (reducedMotion) {
                splitTimeline.progress(0, true).pause();
                lifecycle.onTransitionComplete("closing");
            } else {
                splitTimeline.reverse();
            }
        } else {
            splitTimeline.progress(0, true).pause();
        }
    }, [lifecycle.active, lifecycle.phase]);

    return (
        <section ref={sectionRef} id="contact" className="contact-container" aria-labelledby="contact-title">
            <div ref={orbitRef} className="contact-orbit">
                <svg width="0" height="0" aria-hidden="true">
                    <defs>
                        <filter id="contact-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="contact-blur" />
                            <feColorMatrix
                                in="contact-blur"
                                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
                                result="contact-goo-alpha"
                            />
                            <feBlend in="SourceGraphic" in2="contact-goo-alpha" />
                        </filter>
                    </defs>
                </svg>
                <div ref={blobLayerRef} className="contact-blob-layer" aria-hidden="true">
                    <span className="contact-blob-center" />
                    {contactProfiles.map((profile, index) => (
                        <span
                            ref={(element) => { satelliteRefs.current[index] = element; }}
                            className="contact-satellite"
                            data-contact-link={profile.id}
                            style={{ width: `${profile.diameterRatio * 100}%` }}
                            key={profile.id}
                        />
                    ))}
                </div>
                <nav ref={linkLayerRef} className="contact-link-layer" aria-label="Social profiles">
                    {contactProfiles.map((profile, index) => (
                        <a
                            ref={(element) => { linkRefs.current[index] = element; }}
                            className="contact-link"
                            data-contact-link={profile.id}
                            href={profile.href}
                            style={{ width: `${profile.diameterRatio * 100}%` }}
                            key={profile.id}
                        >
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
