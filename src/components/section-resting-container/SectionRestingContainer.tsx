import type { ReactNode, RefObject } from "react";

type SectionRestingContainerProps = {
    children: ReactNode;
    containerRef: RefObject<HTMLDivElement | null>;
    id?: string;
};

// Gives a section the shared wrapper used for its sticky resting interval.
export function SectionRestingContainer({ children, containerRef, id }: SectionRestingContainerProps) {
    return (
        <div ref={containerRef} id={id} className="section-static-container">
            {children}
        </div>
    );
}
