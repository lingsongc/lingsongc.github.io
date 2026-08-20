function documentTop(element: HTMLElement) {
    let top = 0;
    let current: HTMLElement | null = element;

    while (current) {
        top += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
    }

    return top;
}

export const sectionTransitionTimelineDefaults = { duration: 1, ease: "none" };

export function sectionTransitionScroll(incomingSection: HTMLElement) {
    return {
        trigger: incomingSection,
        start: () => documentTop(incomingSection) - window.innerHeight,
        end: () => documentTop(incomingSection),
        scrub: true,
        invalidateOnRefresh: true,
    };
}
