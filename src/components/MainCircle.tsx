import { useRef } from "react";
import { useMainCircleScene } from "../motion/useMainCircleScene";
import type { ImageDescriptor } from "../types/images";

type MainCircleProps = {
    image: ImageDescriptor | null;
};

export function MainCircle({ image }: MainCircleProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef);

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
