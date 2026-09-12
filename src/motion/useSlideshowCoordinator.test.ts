import { describe, expect, it } from "vitest";
import {
    advanceSceneTransition,
    createSceneTransitionState,
    initialSceneIdFromHash,
    requestSceneTransition,
    sceneIdFromHash,
    sceneUrl,
} from "./useSlideshowCoordinator";

// Verifies pure request, phase, and URL decisions used by the React-owned coordinator.
describe("slideshow coordinator model", () => {
    it("accepts adjacent and distant requests with direction", () => {
        expect(requestSceneTransition(createSceneTransitionState("about"), {
            kind: "adjacent", direction: "forward", source: "wheel",
        })).toMatchObject({ result: { status: "accepted", destinationSceneId: "experience", direction: "forward" } });
        expect(requestSceneTransition(createSceneTransitionState("skills"), {
            kind: "direct", destinationSceneId: "about", source: "navigation",
        })).toMatchObject({ result: { status: "accepted", destinationSceneId: "about", direction: "backward" } });
    });

    it("rejects terminal requests and ignores same or busy requests", () => {
        expect(requestSceneTransition(createSceneTransitionState("home"), {
            kind: "adjacent", direction: "backward", source: "keyboard",
        }).result).toEqual({ status: "rejected", reason: "boundary" });
        expect(requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "about", source: "history",
        }).result).toEqual({ status: "ignored", reason: "same-scene" });
        const busy = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "contact", source: "navigation",
        }).state;
        expect(requestSceneTransition(busy, {
            kind: "direct", destinationSceneId: "home", source: "history",
        }).result).toEqual({ status: "ignored", reason: "busy" });
    });

    it("advances close, movement, opening, and idle deterministically", () => {
        let state = requestSceneTransition(createSceneTransitionState("about"), {
            kind: "direct", destinationSceneId: "projects", source: "navigation",
        }).state;
        expect(state.phase).toBe("closing");
        state = advanceSceneTransition(state);
        expect(state.phase).toBe("moving");
        state = advanceSceneTransition(state);
        expect(state).toMatchObject({ phase: "opening", currentSceneId: "projects" });
        state = advanceSceneTransition(state);
        expect(state).toEqual(createSceneTransitionState("projects"));
    });

    it("parses and formats scene hashes", () => {
        expect(sceneIdFromHash("#experience")).toBe("experience");
        expect(sceneIdFromHash("#unknown")).toBeNull();
        expect(initialSceneIdFromHash("")).toBe("home");
        expect(sceneUrl("projects", { pathname: "/portfolio/", search: "?preview=1" }))
            .toBe("/portfolio/?preview=1#projects");
    });
});
