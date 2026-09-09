import type { SceneId, ScenePhase } from "./scene";

// Defines the shared geometry and transition contracts for the main circle.
export type MainCircleEndpoint = {
    width: number;
    top: number;
    left: number;
};

export type MainCircleEndpointResolver<Context> = (context: Context) => MainCircleEndpoint;

export type MainCircleSceneEndpointResolvers<Context> = Record<
    SceneId,
    MainCircleEndpointResolver<Context>
>;

export type MainCircleSceneEndpoints = Record<SceneId, MainCircleEndpoint>;

export type MainCircleDirectTransition = {
    currentSceneId: SceneId;
    requestedSceneId: SceneId | null;
    phase: ScenePhase;
    travelProgress: number;
    resolveEndpoint: (sceneId: SceneId) => MainCircleEndpoint;
    ease?: (progress: number) => number;
    onTravelProgress?: (easedProgress: number) => void;
};
