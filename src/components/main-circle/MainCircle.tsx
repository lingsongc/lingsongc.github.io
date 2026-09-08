import type { RefObject } from "react";
import { useMainCircleTransition } from "../../motion/useMainCircleTransition";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleTransition } from "../../types/mainCircle";
import type { SceneId } from "../../types/scene";

type MainCircleProps = {
    circleRef: RefObject<HTMLDivElement | null>;
    image: ImageDescriptor | null;
    navigationTargetId: SceneId | null;
    transitions: readonly MainCircleTransition[];
};

// Displays the current image and moves its circular frame between sections.
export function MainCircle({ circleRef, image, navigationTargetId, transitions }: MainCircleProps) {
    useMainCircleTransition(circleRef, transitions, navigationTargetId);

    return (
        <div ref={circleRef} className="main-circle-container">
            <div className="main-circle-mask">
                {image && (
                    <img
                        className="main-circle-image"
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
