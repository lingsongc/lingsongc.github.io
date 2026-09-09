import { describe, expect, it } from "vitest";
import { sceneOrder, type ScenePhase, type SceneRequest } from "../types/scene";
import {
    advanceSceneTransition,
    createSceneTransitionState,
    recoverSceneTransition,
    requestSceneTransition,
    type SceneRecoveryReason,
    type SceneTransitionState,
} from "./sceneTransitionState";

const directContactRequest: SceneRequest = {
    kind: "direct",
    destinationSceneId: "contact",
    source: "navigation",
};

// Verifies deterministic scene requests, lifecycle progress, and recovery.
describe("scene transition state", () => {
    it("creates one idle current scene without pending transition state", () => {
        expect(createSceneTransitionState("home")).toEqual({
            currentSceneId: "home",
            direction: null,
            phase: "idle",
            requestedSceneId: null,
        });
    });

    it("accepts an adjacent forward request", () => {
        const update = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "adjacent",
            direction: "forward",
            source: "wheel",
        });

        expect(update).toEqual({
            result: {
                status: "accepted",
                destinationSceneId: "experience",
                direction: "forward",
            },
            state: {
                currentSceneId: "about",
                direction: "forward",
                phase: "closing",
                requestedSceneId: "experience",
            },
        });
    });

    it("accepts an adjacent backward request", () => {
        const update = requestSceneTransition(createSceneTransitionState("projects"), {
            kind: "adjacent",
            direction: "backward",
            source: "keyboard",
        });

        expect(update.result).toEqual({
            status: "accepted",
            destinationSceneId: "experience",
            direction: "backward",
        });
    });

    it("accepts a direct non-adjacent request without visiting intermediate scenes", () => {
        const update = requestSceneTransition(createSceneTransitionState("about"), directContactRequest);

        expect(update.result).toEqual({
            status: "accepted",
            destinationSceneId: "contact",
            direction: "forward",
        });
        expect(update.state.requestedSceneId).toBe("contact");
    });

    it.each(sceneOrder.flatMap((originSceneId) => sceneOrder
        .filter((destinationSceneId) => destinationSceneId !== originSceneId)
        .map((destinationSceneId) => [originSceneId, destinationSceneId] as const),
    ))("accepts direct rail travel from %s to %s without intermediate state", (
        originSceneId,
        destinationSceneId,
    ) => {
        const update = requestSceneTransition(createSceneTransitionState(originSceneId), {
            kind: "direct",
            destinationSceneId,
            source: "navigation",
        });

        expect(update.result).toMatchObject({
            status: "accepted",
            destinationSceneId,
        });
        expect(update.state).toMatchObject({
            currentSceneId: originSceneId,
            phase: "closing",
            requestedSceneId: destinationSceneId,
        });
    });

    it("derives backward direction for a reverse direct request", () => {
        const update = requestSceneTransition(createSceneTransitionState("skills"), {
            kind: "direct",
            destinationSceneId: "about",
            source: "history",
        });

        expect(update.result).toEqual({
            status: "accepted",
            destinationSceneId: "about",
            direction: "backward",
        });
    });

    it("ignores a direct request for the current scene", () => {
        const state = createSceneTransitionState("projects");
        const update = requestSceneTransition(state, {
            kind: "direct",
            destinationSceneId: "projects",
            source: "navigation",
        });

        expect(update.result).toEqual({ status: "ignored", reason: "same-scene" });
        expect(update.state).toBe(state);
    });

    it.each([
        ["home", "backward"],
        ["contact", "forward"],
    ] as const)("rejects unavailable %s boundary input", (sceneId, direction) => {
        const state = createSceneTransitionState(sceneId);
        const update = requestSceneTransition(state, {
            kind: "adjacent",
            direction,
            source: "touch",
        });

        expect(update.result).toEqual({ status: "rejected", reason: "boundary" });
        expect(update.state).toBe(state);
    });

    it.each(["closing", "moving", "opening"] as const)(
        "ignores requests during the %s phase without queuing them",
        (phase) => {
            const state = transitionStateAtPhase(phase);
            const update = requestSceneTransition(state, directContactRequest);

            expect(update.result).toEqual({ status: "ignored", reason: "busy" });
            expect(update.state).toBe(state);
            expect(update.state.requestedSceneId).toBe("experience");
        },
    );

    it("advances through closing, moving, opening, and the destination idle state", () => {
        const requested = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "adjacent",
            direction: "forward",
            source: "keyboard",
        }).state;
        const moving = advanceSceneTransition(requested);
        const opening = advanceSceneTransition(moving);
        const idle = advanceSceneTransition(opening);

        expect(moving.phase).toBe("moving");
        expect(opening).toEqual({
            currentSceneId: "experience",
            direction: "forward",
            phase: "opening",
            requestedSceneId: "experience",
        });
        expect(idle).toEqual(createSceneTransitionState("experience"));
        expect(advanceSceneTransition(idle)).toBe(idle);
    });

    it.each([
        ["resize", "closing"],
        ["orientation-change", "moving"],
        ["document-hidden", "opening"],
    ] satisfies readonly (readonly [
        SceneRecoveryReason,
        Exclude<ScenePhase, "idle">,
    ])[])(
        "settles on the requested destination during %s recovery from %s",
        (reason, phase) => {
            const state = transitionStateAtPhase(phase);
            expect(recoverSceneTransition(state, reason)).toEqual(
                createSceneTransitionState("experience"),
            );
        },
    );

    it("leaves an already idle scene unchanged during recovery", () => {
        const state = createSceneTransitionState("skills");
        expect(recoverSceneTransition(state, "resize")).toBe(state);
    });
});

// Produces a valid busy state at the requested lifecycle phase.
function transitionStateAtPhase(phase: Exclude<ScenePhase, "idle">): SceneTransitionState {
    const closing = requestSceneTransition(createSceneTransitionState("about"), {
        kind: "adjacent",
        direction: "forward",
        source: "wheel",
    }).state;

    if (phase === "closing") return closing;
    const moving = advanceSceneTransition(closing);
    if (phase === "moving") return moving;
    return advanceSceneTransition(moving);
}
