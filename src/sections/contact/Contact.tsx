import { useRef, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { contactFinalOffset, contactInitialOffset } from "./contactGeometry";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ContactProps = {
    sectionRef: RefObject<HTMLElement | null>;
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
export function Contact({ sectionRef }: ContactProps) {
    const orbitRef = useRef<HTMLDivElement>(null);
    const blobLayerRef = useRef<HTMLDivElement>(null);
    const linkLayerRef = useRef<HTMLElement>(null);
    const satelliteRefs = useRef<Array<HTMLSpanElement | null>>([]);
    const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);

    useGSAP(() => {
        const section = sectionRef.current;
        const orbit = orbitRef.current;
        const blobLayer = blobLayerRef.current;
        const linkLayer = linkLayerRef.current;
        if (!section || !orbit || !blobLayer || !linkLayer) return;

        const splitElements = [...satelliteRefs.current, ...linkRefs.current]
            .filter((element): element is HTMLElement => element !== null);
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        
        // Finds the shared profile settings for a rendered link or shape.
        const contactProfile = (element: HTMLElement) => (
            contactProfilesById.get(element.dataset.contactLink as typeof contactProfiles[number]["id"])
        );
        
        // Calculates a rendered profile's final offset from the orbit center.
        const profileFinalOffset = (element: HTMLElement, axis: 0 | 1) => {
            const profile = contactProfile(element);
            return contactFinalOffset(profile?.offset ?? [0, 0], orbit.offsetWidth, axis);
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
        const splitTimeline = gsap.timeline({ paused: true })
            .to(blobLayer, { autoAlpha: 1, duration: 0.06 }, 0)
            .to(splitElements, {
                x: (_, element: HTMLElement) => profileFinalOffset(element, 0),
                y: (_, element: HTMLElement) => profileFinalOffset(element, 1),
                duration: 0.5,
                ease: "power2.inOut",
            }, 0)
            .to(linkLayer, { autoAlpha: 1, duration: 0.12 }, 0.38);

        const splitTrigger = ScrollTrigger.create({
            trigger: section,
            start: "top 1px",
            invalidateOnRefresh: true,
            onEnter: () => reducedMotion ? splitTimeline.progress(1) : splitTimeline.play(),
            onLeaveBack: () => reducedMotion ? splitTimeline.progress(0) : splitTimeline.reverse(),
            onRefresh: (self) => {
                if (self.isActive) splitTimeline.progress(reducedMotion ? 1 : splitTimeline.progress()).play();
            },
        });

        return () => {
            splitTrigger.kill();
            splitTimeline.kill();
        };
    }, { scope: sectionRef });

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
                <h2 id="contact-title">Contact</h2>
                <p className="contact-description">Have a project in mind?</p>
                <a className="contact-action" href="mailto:lingsong.c4@gmail.com">Send me an email</a>
            </div>
        </section>
    );
}
