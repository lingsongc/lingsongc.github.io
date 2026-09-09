// Defines the shared scene identity and transition lifecycle vocabulary.
type Assert<T extends true> = T;

export type SceneId =
    | "home"
    | "about"
    | "experience"
    | "projects"
    | "skills"
    | "contact";

export const sceneOrder = [
    "home",
    "about",
    "experience",
    "projects",
    "skills",
    "contact",
] as const satisfies readonly SceneId[];

export type ScenePhase = "idle" | "closing" | "moving" | "opening";
export type SceneVisualTransitionPhase = Extract<ScenePhase, "closing" | "opening">;

export type SceneLifecycleControl = {
    active: boolean;
    phase: ScenePhase;
    onTransitionComplete: (phase: SceneVisualTransitionPhase) => void;
};

export type SceneDirection = "forward" | "backward";
export type AdjacentSceneRequestSource = "wheel" | "touch" | "keyboard";
export type DirectSceneRequestSource = "navigation" | "history";
export type SceneRequestSource = AdjacentSceneRequestSource | DirectSceneRequestSource;

export type AdjacentSceneRequest = {
    kind: "adjacent";
    direction: SceneDirection;
    source: AdjacentSceneRequestSource;
};

export type DirectSceneRequest = {
    kind: "direct";
    destinationSceneId: SceneId;
    source: DirectSceneRequestSource;
};

export type SceneRequest = AdjacentSceneRequest | DirectSceneRequest;

export type SceneRequestResult =
    | {
        status: "accepted";
        destinationSceneId: SceneId;
        direction: SceneDirection;
    }
    | {
        status: "ignored";
        reason: "busy" | "same-scene";
    }
    | {
        status: "rejected";
        reason: "boundary";
    };

// Makes an omitted scene fail type-checking even though the order is declared separately.
export type CompleteSceneOrder = Assert<
    Exclude<SceneId, (typeof sceneOrder)[number]> extends never ? true : false
>;
