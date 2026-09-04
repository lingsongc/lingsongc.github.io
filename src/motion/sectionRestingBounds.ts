export function elementDocumentTop(element: HTMLElement) {
    let top = 0;
    let current: HTMLElement | null = element;

    while (current) {
        top += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
    }

    return top;
}

export function sectionRestingBounds(restingContainer: HTMLElement) {
    const start = elementDocumentTop(restingContainer);
    return {
        start,
        end: start + restingContainer.offsetHeight - window.innerHeight,
    };
}

export function alignMountedSectionAnchor(restingContainer: HTMLElement) {
    if (!restingContainer.id || window.location.hash !== `#${restingContainer.id}`) return;
    window.scrollTo({ top: elementDocumentTop(restingContainer) });
}
