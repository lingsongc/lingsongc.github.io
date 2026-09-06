import type { CSSProperties } from "react";

export type ImageDescriptor = {
    src: string;
    alt: string;
    objectPosition?: CSSProperties["objectPosition"];
    transform?: CSSProperties["transform"];
};

export type MainCircleImagePublisher = (image: ImageDescriptor | null) => void;
