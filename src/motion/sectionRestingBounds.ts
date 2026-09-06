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
    return {
        start,
        end: start + restingContainer.offsetHeight - window.innerHeight,
    };
}

// Aligns a directly linked section with its resting position.
export function alignMountedSectionAnchor(restingContainer: HTMLElement) {
    if (!restingContainer.id || window.location.hash !== `#${restingContainer.id}`) return;
    window.scrollTo({ top: elementDocumentTop(restingContainer) });
}

// Waits for layout to settle before aligning a directly linked section.
export function scheduleMountedSectionAnchorAlignment(
    restingContainer: HTMLElement,
    onAligned?: () => void,
) {
    let alignmentFrame: number | undefined;
    const setupFrame = window.requestAnimationFrame(() => {
        alignmentFrame = window.requestAnimationFrame(() => {
            alignMountedSectionAnchor(restingContainer);
            onAligned?.();
        });
    });

    return () => {
        window.cancelAnimationFrame(setupFrame);
        window.cancelAnimationFrame(alignmentFrame ?? 0);
    };
}
