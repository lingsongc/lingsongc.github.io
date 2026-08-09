import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollSceneRefs = {
    navigationRef: RefObject<HTMLElement | null>;
    copyrightRef: RefObject<HTMLElement | null>;
    ringRef: RefObject<HTMLDivElement | null>;
};

export function useScrollScene({ navigationRef, copyrightRef, ringRef }: ScrollSceneRefs) {
    useGSAP(() => {
        const navigation = navigationRef.current;
        const copyright = copyrightRef.current;
        const ring = ringRef.current;

        if (!navigation || !ring) return;

        const items = gsap.utils.toArray<HTMLElement>(
            navigation.querySelectorAll<HTMLElement>(".navigation-item"),
        );

        if (items.length === 0) return;

        const radius = () => ring.offsetWidth / 2 - Number.parseFloat(getComputedStyle(ring).borderLeftWidth) / 2;
        const angle = (index: number) => (index * 60 + 30) * Math.PI / 180;
        const dockedY = (index: number) => index === 0
            ? 32 - window.innerHeight / 2
            : window.innerHeight / 2 - 32 - (items.length - 1 - index) * 48;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        
        let dockedFrame: number | undefined;
        let effectsFrame: number | undefined;

        const clearReadyState = () => {
            if (dockedFrame !== undefined) cancelAnimationFrame(dockedFrame);
            if (effectsFrame !== undefined) cancelAnimationFrame(effectsFrame);
            dockedFrame = undefined;
            effectsFrame = undefined;
            navigation.classList.remove(
                "navigation-home-ready",
                "navigation-docked",
                "navigation-effects-ready",
            );
            navigation.setAttribute("inert", "");
            copyright?.classList.remove("navigation-copyright-visible");
        };

        navigation.classList.add("navigation-home-ready");
        navigation.removeAttribute("inert");

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
                    if (self.progress === 0) {
                        clearReadyState();
                        navigation.classList.add("navigation-home-ready");
                        navigation.removeAttribute("inert");
                    } else if (self.progress === 1
                        && !navigation.classList.contains("navigation-docked")) {
                        clearReadyState();
                        dockedFrame = requestAnimationFrame(() => {
                            navigation.classList.add("navigation-docked");
                            dockedFrame = undefined;
                            effectsFrame = requestAnimationFrame(() => {
                                navigation.classList.add("navigation-effects-ready");
                                navigation.removeAttribute("inert");
                                copyright?.classList.add("navigation-copyright-visible");
                                effectsFrame = undefined;
                            });
                        });
                    } else if (self.progress < 1) {
                        clearReadyState();
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
            clearReadyState();
        };
    }, []);
}
