import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint } from "../../types/mainCircle";

type MainCircleProps = {
    geometry: MainCircleEndpoint | null;
    image: ImageDescriptor | null;
    imageVisible?: boolean;
};

// Displays the current image and moves its circular frame between sections.
export function MainCircle({
    geometry,
    image,
    imageVisible = true,
}: MainCircleProps) {
    return (
        <div className="main-circle-container" style={geometry ?? undefined}>
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
