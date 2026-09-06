import { useEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { elementDocumentTop } from "./sectionRestingBounds";

gsap.registerPlugin(ScrollTrigger);

// Aligns every section link through one shared setup sequence, then refreshes scroll motion.
export function usePageSectionInitialization(
    sectionRefs: readonly RefObject<HTMLElement | null>[],
) {
    useEffect(() => {
        let layoutFrame = 0;
        let alignmentFrame = 0;
        let refreshFrame = 0;

        // Cancels an unfinished setup before starting a newer section-link request.
        const cancelScheduledInitialization = () => {
            window.cancelAnimationFrame(layoutFrame);
            window.cancelAnimationFrame(alignmentFrame);
            window.cancelAnimationFrame(refreshFrame);
        };

        // Gives React and GSAP time to create the page before measuring the linked section.
        const initializeSectionLink = () => {
            cancelScheduledInitialization();
            layoutFrame = window.requestAnimationFrame(() => {
                alignmentFrame = window.requestAnimationFrame(() => {
                    alignCurrentSectionLink(sectionRefs);
                    refreshFrame = window.requestAnimationFrame(() => {
                        ScrollTrigger.refresh();
                        ScrollTrigger.update();
                        // Updates section-owned visibility when alignment does not emit a scroll event.
                        window.dispatchEvent(new Event("scroll"));
                    });
                });
            });
        };

        window.addEventListener("hashchange", initializeSectionLink);
        initializeSectionLink();

        return () => {
            cancelScheduledInitialization();
            window.removeEventListener("hashchange", initializeSectionLink);
        };
    }, [sectionRefs]);
}

// Moves the requested section to the top only when it belongs to this page.
function alignCurrentSectionLink(sectionRefs: readonly RefObject<HTMLElement | null>[]) {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;

    const target = sectionRefs.find((sectionRef) => sectionRef.current?.id === sectionId)?.current;
    if (!target) return;

    window.scrollTo({ top: elementDocumentTop(target) });
}
