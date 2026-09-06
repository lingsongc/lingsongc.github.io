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
