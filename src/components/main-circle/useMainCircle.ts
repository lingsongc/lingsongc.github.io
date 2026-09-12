import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ImageDescriptor } from "../../types/images";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import type { SceneId, ScenePhase } from "../../types/scene";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS, mainCircleTravelAtTime } from "./mainCircleGeometry";

type MainCircleOptions = {
    currentSceneId: SceneId;
    requestedSceneId: SceneId | null;
    phase: ScenePhase;
    travelProgress: number;
    layoutVersion: number;
    resolveEndpoint: (sceneId: SceneId) => MainCircleEndpoint;
};

type EndpointSnapshot = { from: MainCircleEndpoint; key: string; to: MainCircleEndpoint };
type SceneImageRegistry = Partial<Record<SceneId, ImageDescriptor>>;

// Owns the persistent circle's endpoint snapshot, shared geometry, and image registry.
export function useMainCircle({
    currentSceneId,
    requestedSceneId,
    phase,
    travelProgress,
    layoutVersion,
    resolveEndpoint,
}: MainCircleOptions) {
    const endpointSnapshotRef = useRef<EndpointSnapshot | null>(null);
    const [geometry, setGeometry] = useState<MainCircleEndpoint | null>(null);
    const [easedTravelProgress, setEasedTravelProgress] = useState(0);
    const [images, setImages] = useState<SceneImageRegistry>({});

    useLayoutEffect(() => {
        void layoutVersion;
        if (phase !== "moving" || !requestedSceneId) {
            endpointSnapshotRef.current = null;
            setGeometry(resolveEndpoint(currentSceneId));
            setEasedTravelProgress(phase === "opening" ? 1 : 0);
            return;
        }

        const key = `${currentSceneId}:${requestedSceneId}`;
        if (endpointSnapshotRef.current?.key !== key) {
            endpointSnapshotRef.current = {
                from: resolveEndpoint(currentSceneId),
                key,
                to: resolveEndpoint(requestedSceneId),
            };
        }
        const endpoints = endpointSnapshotRef.current;
        const snapshot = mainCircleTravelAtTime(
            endpoints.from,
            endpoints.to,
            travelProgress * MAIN_CIRCLE_TRAVEL_DURATION_MS,
            smoothDirectTravelEase,
        );
        setGeometry(snapshot.endpoint);
        setEasedTravelProgress(snapshot.easedProgress);
    }, [currentSceneId, layoutVersion, phase, requestedSceneId, resolveEndpoint, travelProgress]);

    const publishSceneImage = useCallback((sceneId: SceneId, image: ImageDescriptor | null) => {
        if (!image) return;
        setImages((current) => current[sceneId] === image ? current : { ...current, [sceneId]: image });
    }, []);

    const imageState = useMemo(() => resolveImageState(images, {
        currentSceneId, requestedSceneId, phase,
    }), [currentSceneId, images, phase, requestedSceneId]);

    return { geometry, easedTravelProgress, ...imageState, publishSceneImage };
}

// Keeps travel blank while staging the destination descriptor for opening.
export function resolveImageState(
    images: SceneImageRegistry,
    state: Pick<MainCircleOptions, "currentSceneId" | "requestedSceneId" | "phase">,
) {
    const stagedSceneId = state.phase === "moving"
        ? state.requestedSceneId ?? state.currentSceneId
        : state.currentSceneId;
    const image = images[stagedSceneId] ?? null;
    return { image, imageVisible: image !== null && (state.phase === "idle" || state.phase === "opening") };
}

function smoothDirectTravelEase(progress: number) {
    return progress * progress * (3 - 2 * progress);
}
