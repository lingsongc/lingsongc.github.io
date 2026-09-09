import { useCallback, useState } from "react";
import type { ImageDescriptor } from "../types/images";
import type { SceneId, ScenePhase } from "../types/scene";

export type SceneImageRegistry = Partial<Record<SceneId, ImageDescriptor>>;

export type MainCircleImageLifecycleSnapshot = {
    image: ImageDescriptor | null;
    imageVisible: boolean;
};

export type MainCircleImageLifecycleState = {
    currentSceneId: SceneId;
    phase: ScenePhase;
    requestedSceneId: SceneId | null;
};

// Stores Section-published descriptors and derives the image shown in each phase.
export function useMainCircleImageLifecycle(state: MainCircleImageLifecycleState) {
    const [images, setImages] = useState<SceneImageRegistry>({});

    const publishSceneImage = useCallback((sceneId: SceneId, image: ImageDescriptor | null) => {
        if (!image) return;
        setImages((current) => publishSceneImageDescriptor(current, sceneId, image));
    }, []);

    return {
        ...resolveMainCircleImageLifecycle(images, state),
        publishSceneImage,
    };
}

// Retains the latest descriptor per Scene so an outgoing clear cannot erase a newer image.
export function publishSceneImageDescriptor(
    images: SceneImageRegistry,
    sceneId: SceneId,
    image: ImageDescriptor | null,
): SceneImageRegistry {
    if (!image || images[sceneId] === image) return images;
    return { ...images, [sceneId]: image };
}

// Keeps travel blank while staging the destination descriptor for its opening fade.
export function resolveMainCircleImageLifecycle(
    images: SceneImageRegistry,
    state: MainCircleImageLifecycleState,
): MainCircleImageLifecycleSnapshot {
    const stagedSceneId = state.phase === "moving"
        ? state.requestedSceneId ?? state.currentSceneId
        : state.currentSceneId;
    const image = images[stagedSceneId] ?? null;
    const imageVisible = image !== null && (state.phase === "idle" || state.phase === "opening");
    return { image, imageVisible };
}
