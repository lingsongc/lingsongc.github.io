// Returns an element's vertical position within the full document.
export function elementDocumentTop(element: HTMLElement) {
    let top = 0;
    let current: HTMLElement | null = element;

    while (current) {
        top += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
    }

    return top;
}

// Calculates the scroll range where a section remains at rest.
export function sectionRestingBounds(restingContainer: HTMLElement) {
    const start = elementDocumentTop(restingContainer);
    return sectionRestingRange(start, restingContainer.offsetHeight, window.innerHeight);
}

// Calculates a resting scroll range from measured page dimensions.
export function sectionRestingRange(start: number, containerHeight: number, viewportHeight: number) {
    return { start, end: start + containerHeight - viewportHeight };
}

// Calculates the scroll range used while a section moves into place.
export function sectionIncomingTransitionRange(sectionTop: number, viewportHeight: number) {
    return { start: sectionTop - viewportHeight, end: sectionTop };
}
