import { describe, expect, it } from "vitest";
import { transientRailMarkerProgress } from "./Navigation";

// Verifies Navigation's visual-only intermediate rail markers.
describe("transient rail markers", () => {
    it("omits adjacent and equal endpoints", () => {
        expect(transientRailMarkerProgress("about", "experience", 0.5)).toEqual([]);
        expect(transientRailMarkerProgress("home", "home", 0.5)).toEqual([]);
    });

    it("orders and crossfades distant forward markers", () => {
        expect(transientRailMarkerProgress("about", "skills", 1 / 3)).toEqual([
            { sceneId: "experience", progress: 1 },
            { sceneId: "projects", progress: 0 },
        ]);
        const midpoint = transientRailMarkerProgress("about", "skills", 0.5);
        expect(midpoint.map(({ sceneId }) => sceneId)).toEqual(["experience", "projects"]);
        expect(midpoint[0]?.progress).toBeCloseTo(0.5);
    });

    it("mirrors marker order and clamps progress", () => {
        expect(transientRailMarkerProgress("contact", "home", 0.2).map(({ sceneId }) => sceneId))
            .toEqual(["skills", "projects", "experience", "about"]);
        expect(transientRailMarkerProgress("about", "skills", -1).every(({ progress }) => progress === 0)).toBe(true);
    });
});
