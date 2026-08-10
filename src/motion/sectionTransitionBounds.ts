function documentTop(element: HTMLElement) {
    let top = 0;
    let current: HTMLElement | null = element;

    while (current) {
        top += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
    }

    return top;
}

export function sectionTransitionStart(section: HTMLElement) {
    const restingContainer = section.parentElement;
    const sectionHeight = section.offsetHeight;

    if (!restingContainer || sectionHeight > window.innerHeight) {
        return documentTop(section) + sectionHeight * 0.9;
    }

    return documentTop(restingContainer)
        + restingContainer.offsetHeight
        - sectionHeight * 0.1;
}

export function sectionTransitionEnd(section: HTMLElement) {
    return documentTop(section)
        - window.innerHeight
        + section.offsetHeight * 0.1;
}
