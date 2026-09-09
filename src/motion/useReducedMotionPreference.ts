import { useEffect, useState } from "react";

// Reads the motion preference before the first transition and follows later system changes.
export function useReducedMotionPreference() {
    const [reducedMotion, setReducedMotion] = useState(() => (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ));

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setReducedMotion(mediaQuery.matches);
        mediaQuery.addEventListener("change", updatePreference);
        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, []);

    return reducedMotion;
}
