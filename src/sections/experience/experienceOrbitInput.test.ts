import { describe, expect, it } from "vitest";
import {
    createExperienceWheelBoundaryState,
    updateExperienceWheelBoundary,
} from "./experienceOrbitInput";

// Verifies selector ownership and fresh-gesture release at both entry boundaries.
describe("Experience orbit input", () => {
    it("consumes input while another entry exists", () => {
        const update = updateExperienceWheelBoundary(
            createExperienceWheelBoundaryState(),
            1,
            false,
            100,
        );

        expect(update.consume).toBe(true);
        expect(update.state).toEqual({ direction: 1, lastInputAt: 100 });
    });

    it("keeps momentum that reaches the last entry inside the selector", () => {
        const selectedLast = updateExperienceWheelBoundary(
            createExperienceWheelBoundaryState(),
            1,
            false,
            100,
        );
        const boundaryMomentum = updateExperienceWheelBoundary(
            selectedLast.state,
            1,
            true,
            250,
        );

        expect(boundaryMomentum.consume).toBe(true);
    });

    it("releases a fresh gesture at either selector boundary", () => {
        const forward = { direction: 1 as const, lastInputAt: 100 };
        const backward = { direction: -1 as const, lastInputAt: 100 };

        expect(updateExperienceWheelBoundary(forward, 1, true, 300).consume).toBe(false);
        expect(updateExperienceWheelBoundary(backward, -1, true, 300).consume).toBe(false);
    });
});
