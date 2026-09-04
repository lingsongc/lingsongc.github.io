import type { CSSProperties } from "react";

export type ImageDescriptor = {
    src: string;
    alt: string;
    objectPosition?: CSSProperties["objectPosition"];
    transform?: CSSProperties["transform"];
};
