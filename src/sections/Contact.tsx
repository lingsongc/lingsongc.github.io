import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function Contact() {
    const sectionRef = useRef<HTMLElement>(null);
    const orbitRef = useRef<HTMLDivElement>(null);
    const blobLayerRef = useRef<HTMLDivElement>(null);
    const linkLayerRef = useRef<HTMLElement>(null);

    useGSAP(() => {
        const section = sectionRef.current;
        const orbit = orbitRef.current;
        const blobLayer = blobLayerRef.current;
        const linkLayer = linkLayerRef.current;
        if (!section || !orbit || !blobLayer || !linkLayer) return;

        const satellites = orbit.querySelectorAll<HTMLElement>(".contact-satellite, .contact-link");
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const offsets: Record<string, [number, number]> = {
            github: [-0.78, 0.26],
            instagram: [-0.62, -0.58],
            linkedin: [0.78, -0.28],
        };
        const diameterRatios: Record<string, number> = {
            github: 0.36,
            instagram: 0.28,
            linkedin: 0.31,
        };
        const contactOffset = (element: HTMLElement, axis: 0 | 1) => (
            offsets[element.dataset.contactLink ?? ""]?.[axis] ?? 0
        ) * orbit.offsetWidth;
        const contactInitialOffset = (element: HTMLElement, axis: 0 | 1) => {
            const id = element.dataset.contactLink ?? "";
            const direction = offsets[id] ?? [0, 0];
            const directionLength = Math.hypot(...direction) || 1;
            const insetRadius = 0.5 - (diameterRatios[id] ?? 0) / 2 - 0.02;
            return direction[axis] / directionLength * insetRadius * orbit.offsetWidth;
        };

        gsap.set([blobLayer, linkLayer], { autoAlpha: 0 });
        gsap.set(satellites, {
            xPercent: -50,
            yPercent: -50,
            x: (_, element: HTMLElement) => contactInitialOffset(element, 0),
            y: (_, element: HTMLElement) => contactInitialOffset(element, 1),
            scale: 1,
        });
        const splitTimeline = gsap.timeline({ paused: true })
            .to(blobLayer, { autoAlpha: 1, duration: 0.06 }, 0)
            .to(satellites, {
                x: (_, element: HTMLElement) => contactOffset(element, 0),
                y: (_, element: HTMLElement) => contactOffset(element, 1),
                duration: 0.5,
                ease: "power2.inOut",
            }, 0)
            .to(linkLayer, { autoAlpha: 1, duration: 0.12 }, 0.38);

        ScrollTrigger.create({
            trigger: section,
            start: "top 1px",
            invalidateOnRefresh: true,
            onEnter: () => reducedMotion ? splitTimeline.progress(1) : splitTimeline.play(),
            onLeaveBack: () => reducedMotion ? splitTimeline.progress(0) : splitTimeline.reverse(),
            onRefresh: (self) => {
                if (self.isActive) splitTimeline.progress(reducedMotion ? 1 : splitTimeline.progress()).play();
            },
        });
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
                    <span className="contact-satellite contact-satellite-github" data-contact-link="github" />
                    <span className="contact-satellite contact-satellite-instagram" data-contact-link="instagram" />
                    <span className="contact-satellite contact-satellite-linkedin" data-contact-link="linkedin" />
                </div>
                <nav ref={linkLayerRef} className="contact-link-layer" aria-label="Social profiles">
                    <a className="contact-link contact-link-github" data-contact-link="github" href="https://github.com/lingsongc">GitHub</a>
                    <a className="contact-link contact-link-instagram" data-contact-link="instagram" href="https://www.instagram.com/lingsongc/">Instagram</a>
                    <a className="contact-link contact-link-linkedin" data-contact-link="linkedin" href="https://www.linkedin.com/in/lingsongc/">LinkedIn</a>
                </nav>
            </div>
            <div className="contact-content">
                <h2 id="contact-title" className="contact-title">Contact</h2>
                <p className="contact-description">Have a project in mind?</p>
                <a className="contact-action" href="mailto:lingsong.c4@gmail.com">Send me an email</a>
            </div>
        </section>
    );
}
