import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function useScrollScene() {
    useGSAP(() => {
        // Section timelines will be added in small, tested steps.
    }, []);
}
