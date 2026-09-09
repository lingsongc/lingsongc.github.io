import {
    sceneOrder,
    type SceneDirection,
    type SceneId,
    type ScenePhase,
    type SceneRequest,
    type SceneRequestResult,
} from "../types/scene";

export type SceneTransitionState =
    | {
        currentSceneId: SceneId;
        direction: null;
        phase: "idle";
        requestedSceneId: null;
    }
    | {
        currentSceneId: SceneId;
        direction: SceneDirection;
        phase: Exclude<ScenePhase, "idle">;
        requestedSceneId: SceneId;
    };

export type SceneTransitionUpdate = {
    result: SceneRequestResult;
    state: SceneTransitionState;
};

export type SceneRecoveryReason = "resize" | "orientation-change" | "document-hidden";

// Creates one completed resting scene with no pending destination.
export function createSceneTransitionState(currentSceneId: SceneId): SceneTransitionState {
    return {
        currentSceneId,
        direction: null,
        phase: "idle",
        requestedSceneId: null,
    };
}

// Evaluates one adjacent or direct request without queuing input while busy.
export function requestSceneTransition(
    state: SceneTransitionState,
    request: SceneRequest,
): SceneTransitionUpdate {
    if (state.phase !== "idle") {
        return {
            result: { status: "ignored", reason: "busy" },
            state,
        };
    }

    const destinationSceneId = resolveRequestedSceneId(state.currentSceneId, request);
    if (destinationSceneId === null) {
        return {
            result: { status: "rejected", reason: "boundary" },
            state,
        };
    }
    if (destinationSceneId === state.currentSceneId) {
        return {
            result: { status: "ignored", reason: "same-scene" },
            state,
        };
    }

    const direction = sceneIndex(destinationSceneId) > sceneIndex(state.currentSceneId)
        ? "forward"
        : "backward";

    return {
        result: { status: "accepted", destinationSceneId, direction },
        state: {
            currentSceneId: state.currentSceneId,
            direction,
            phase: "closing",
            requestedSceneId: destinationSceneId,
        },
    };
}

// Advances one committed transition through close, move, open, and idle.
export function advanceSceneTransition(state: SceneTransitionState): SceneTransitionState {
    switch (state.phase) {
        case "idle":
            return state;
        case "closing":
            return { ...state, phase: "moving" };
        case "moving":
            return {
                ...state,
                currentSceneId: state.requestedSceneId,
                phase: "opening",
            };
        case "opening":
            return createSceneTransitionState(state.requestedSceneId);
    }
}

// Settles interrupted work on its destination for every supported recovery event.
export function recoverSceneTransition(
    state: SceneTransitionState,
    _reason: SceneRecoveryReason,
): SceneTransitionState {
    if (state.phase === "idle") return state;
    return createSceneTransitionState(state.requestedSceneId);
}

// Resolves a direct destination or the next ordered scene for directional input.
function resolveRequestedSceneId(currentSceneId: SceneId, request: SceneRequest): SceneId | null {
    if (request.kind === "direct") return request.destinationSceneId;

    const offset = request.direction === "forward" ? 1 : -1;
    return sceneOrder[sceneIndex(currentSceneId) + offset] ?? null;
}

// Finds one scene's position in the compile-time-complete shared ordering.
function sceneIndex(sceneId: SceneId) {
    return sceneOrder.indexOf(sceneId);
}
