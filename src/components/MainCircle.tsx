import { useRef } from "react";
import { useMainCircleScene } from "../motion/useMainCircleScene";
import type { ImageDescriptor } from "../types/images";
import type { MainCircleTransition } from "../types/mainCircle";

type MainCircleProps = {
    image: ImageDescriptor | null;
    transitions: readonly MainCircleTransition[];
};

export function MainCircle({ image, transitions }: MainCircleProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef, transitions);

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
