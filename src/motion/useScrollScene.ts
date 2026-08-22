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
        const homeRing = document.querySelector<HTMLElement>(".home-navigation-ring");
        if (!navigation || !homeRing) return;

        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let railExitTimer: number | undefined;
        let homeEnterTimer: number | undefined;

        const clearReturnTimers = () => {
            window.clearTimeout(railExitTimer);
            window.clearTimeout(homeEnterTimer);
            railExitTimer = undefined;
            homeEnterTimer = undefined;
        };

        const showHome = () => {
            clearReturnTimers();
            navigation.classList.remove("navigation-docked", "navigation-effects-ready", "navigation-rail-exiting", "navigation-home-entering");
            navigation.classList.add("navigation-home-ready");
            navigation.removeAttribute("inert");
            homeRing.classList.remove("home-navigation-ring-exiting");
            copyright?.classList.remove("navigation-copyright-visible", "navigation-copyright-exiting");
        };

        const startHomeReturn = () => {
            if (railExitTimer !== undefined || homeEnterTimer !== undefined) return;

            navigation.classList.add("navigation-rail-exiting");
            navigation.setAttribute("inert", "");
            copyright?.classList.add("navigation-copyright-exiting");

            railExitTimer = window.setTimeout(() => {
                railExitTimer = undefined;
                navigation.classList.remove("navigation-docked", "navigation-effects-ready", "navigation-rail-exiting");
                navigation.classList.add("navigation-home-entering");
                homeRing.classList.remove("home-navigation-ring-exiting");
                copyright?.classList.remove("navigation-copyright-visible", "navigation-copyright-exiting");

                homeEnterTimer = window.setTimeout(() => {
                    homeEnterTimer = undefined;
                    navigation.classList.remove("navigation-home-entering");
                    navigation.classList.add("navigation-home-ready");
                    navigation.removeAttribute("inert");
                }, 500);
            }, 250);
        };

        const updateNavigationPosition = () => {
            const isDocked = window.scrollY > 0;
            if (!isDocked) {
                if (prefersReducedMotion) showHome();
                else if (navigation.classList.contains("navigation-docked")) startHomeReturn();
                else if (!navigation.classList.contains("navigation-home-entering")) showHome();
                return;
            }

            clearReturnTimers();
            navigation.classList.remove("navigation-home-ready", "navigation-home-entering", "navigation-rail-exiting");
            navigation.classList.add("navigation-docked", "navigation-effects-ready");
            navigation.removeAttribute("inert");
            homeRing.classList.add("home-navigation-ring-exiting");
            copyright?.classList.remove("navigation-copyright-exiting");
            copyright?.classList.add("navigation-copyright-visible");
        };

        ScrollTrigger.create({
            start: 0,
            end: "max",
            onUpdate: updateNavigationPosition,
            onRefresh: updateNavigationPosition,
        });
        updateNavigationPosition();

        return () => {
            clearReturnTimers();
            navigation.classList.remove(
                "navigation-home-ready",
                "navigation-home-entering",
                "navigation-docked",
                "navigation-effects-ready",
                "navigation-rail-exiting",
            );
            navigation.removeAttribute("inert");
            homeRing.classList.remove("home-navigation-ring-exiting");
            copyright?.classList.remove("navigation-copyright-visible", "navigation-copyright-exiting");
        };
    }, []);
}
