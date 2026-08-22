import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type ScrollSceneRefs = {
    navigationRef: RefObject<HTMLElement | null>;
    copyrightRef: RefObject<HTMLElement | null>;
};

export function useScrollScene({ navigationRef, copyrightRef }: ScrollSceneRefs) {
    useGSAP(() => {
        const navigation = navigationRef.current;
        const copyright = copyrightRef.current;
        if (!navigation) return;

        const updateNavigationPosition = () => {
            const isDocked = window.scrollY > 0;
            navigation.classList.toggle("navigation-home-ready", !isDocked);
            navigation.classList.toggle("navigation-docked", isDocked);
            navigation.classList.toggle("navigation-effects-ready", isDocked);
            navigation.removeAttribute("inert");
            copyright?.classList.toggle("navigation-copyright-visible", isDocked);
        };

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: updateNavigationPosition,
            onRefresh: updateNavigationPosition,
        });
        updateNavigationPosition();

        return () => {
            navigation.classList.remove(
                "navigation-home-ready",
                "navigation-docked",
                "navigation-effects-ready",
            );
        };
    }, []);
}
