import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useScrollScene() {
    useGSAP(() => {
        const navigation = document.querySelector<HTMLElement>(".navigation-container");
        const copyright = document.querySelector<HTMLElement>(".navigation-copyright");
        const ring = document.querySelector<HTMLElement>(".navigation-ring");
        const items = gsap.utils.toArray<HTMLElement>(".navigation-item");

        if (!navigation || !ring || items.length === 0) return;

        const radius = () => ring.offsetWidth / 2
            - Number.parseFloat(getComputedStyle(ring).borderLeftWidth) / 2;
        const angle = (index: number) => (index * 60 + 30) * Math.PI / 180;
        const dockedY = (index: number) => index === 0
            ? 32 - window.innerHeight / 2
            : window.innerHeight / 2 - 32 - (items.length - 1 - index) * 48;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let dockedFrame: number | undefined;
        let effectsFrame: number | undefined;

        const clearDockedState = () => {
            if (dockedFrame !== undefined) cancelAnimationFrame(dockedFrame);
            if (effectsFrame !== undefined) cancelAnimationFrame(effectsFrame);
            dockedFrame = undefined;
            effectsFrame = undefined;
            navigation.classList.remove("navigation-docked", "navigation-effects-ready");
            copyright?.classList.remove("navigation-copyright-visible");
        };

        gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
                trigger: "#home",
                start: "top top",
                end: () => `bottom ${2 * Number.parseFloat(
                    getComputedStyle(document.documentElement).fontSize,
                )}px`,
                scrub: true,
                invalidateOnRefresh: true,
                onUpdate: (self) => {
                    if (self.progress === 1 && !navigation.classList.contains("navigation-docked")) {
                        dockedFrame = requestAnimationFrame(() => {
                            navigation.classList.add("navigation-docked");
                            dockedFrame = undefined;
                            effectsFrame = requestAnimationFrame(() => {
                                navigation.classList.add("navigation-effects-ready");
                                copyright?.classList.add("navigation-copyright-visible");
                                effectsFrame = undefined;
                            });
                        });
                    } else if (self.progress < 1) {
                        clearDockedState();
                    }

                    if (reducedMotion) self.animation?.progress(self.progress < 0.5 ? 0 : 1);
                },
            },
        })
            .to(items, {
                "--navigation-angle": (index: number) => `${index * 60 + 30}deg`,
                "--navigation-x": (index: number) => `${window.innerWidth / 2 - 32
                    - radius() * Math.sin(angle(index))}px`,
                "--navigation-y": (index: number) => `${dockedY(index)
                    + radius() * Math.cos(angle(index))}px`,
            }, 0)
            .to(ring, { opacity: 0, scale: 0.1 }, 0);

        return () => {
            clearDockedState();
        };
    }, []);
}
