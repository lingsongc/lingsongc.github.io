import type { RefObject } from "react";
import { useMainCircleTransition } from "../../motion/useMainCircleTransition";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleDirectTransition } from "../../types/mainCircle";

type MainCircleProps = {
    circleRef: RefObject<HTMLDivElement | null>;
    directTransition: MainCircleDirectTransition;
    image: ImageDescriptor | null;
    imageVisible?: boolean;
};

// Displays the current image and moves its circular frame between sections.
export function MainCircle({
    circleRef,
    directTransition,
    image,
    imageVisible = true,
}: MainCircleProps) {
    useMainCircleTransition(circleRef, directTransition);

    return (
        <div ref={circleRef} className="main-circle-container">
            <div className="main-circle-mask">
                {image && (
                    <img
                        className={`main-circle-image${imageVisible ? " main-circle-image-visible" : ""}`}
                        src={image.src}
                        alt={image.alt}
                        style={{
                            objectPosition: image.objectPosition,
                            transform: image.transform,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
