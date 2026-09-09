import { describe, expect, it } from "vitest";
import { transientRailMarkerProgress } from "./railTravelProgress";

// Verifies visual marker order without changing semantic current-scene state.
describe("rail travel progress", () => {
    it("returns no transient marker for an adjacent journey", () => {
        expect(transientRailMarkerProgress("about", "experience", 0.5)).toEqual([]);
    });

    it("orders intermediate markers from About to Skills", () => {
        expect(transientRailMarkerProgress("about", "skills", 0)).toEqual([
            { sceneId: "experience", progress: 0 },
            { sceneId: "projects", progress: 0 },
        ]);
        expect(transientRailMarkerProgress("about", "skills", 1 / 3)).toEqual([
            { sceneId: "experience", progress: 1 },
            { sceneId: "projects", progress: 0 },
        ]);
    });

    it("crossfades intermediate markers without including either semantic endpoint", () => {
        const midpoint = transientRailMarkerProgress("about", "skills", 0.5);

        expect(midpoint.map(({ sceneId }) => sceneId)).toEqual(["experience", "projects"]);
        expect(midpoint[0]?.progress).toBeCloseTo(0.5);
        expect(midpoint[1]?.progress).toBeCloseTo(0.5);
        expect(transientRailMarkerProgress("about", "skills", 1)).toEqual([
            { sceneId: "experience", progress: 0 },
            { sceneId: "projects", progress: 0 },
        ]);
    });

    it("mirrors marker order from Skills to About", () => {
        expect(transientRailMarkerProgress("skills", "about", 1 / 3)).toEqual([
            { sceneId: "projects", progress: 1 },
            { sceneId: "experience", progress: 0 },
        ]);
    });

    it("keeps Home and Contact as bounds rather than transient markers", () => {
        const forward = transientRailMarkerProgress("home", "contact", 0.2);
        const reverse = transientRailMarkerProgress("contact", "home", 0.2);

        expect(forward.map(({ sceneId }) => sceneId)).toEqual([
            "about",
            "experience",
            "projects",
            "skills",
        ]);
        expect(reverse.map(({ sceneId }) => sceneId)).toEqual([
            "skills",
            "projects",
            "experience",
            "about",
        ]);
        expect(forward[0]?.progress).toBe(1);
        expect(reverse[0]?.progress).toBe(1);
    });

    it("returns no transient markers when both endpoints are Home", () => {
        expect(transientRailMarkerProgress("home", "home", 0.5)).toEqual([]);
    });

    it("clamps visual progress outside the travel range", () => {
        expect(transientRailMarkerProgress("about", "skills", -1).every(({ progress }) => progress === 0)).toBe(true);
        expect(transientRailMarkerProgress("about", "skills", 2).every(({ progress }) => progress === 0)).toBe(true);
    });
});
