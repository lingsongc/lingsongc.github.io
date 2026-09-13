import { describe, expect, it } from "vitest";
import {
    createWarpedGridPaths,
    scrollFeedbackDisplacementX,
    warpGridPoint,
    type GridCircle,
    type GridScrollFeedback,
} from "./backgroundGridGeometry";

const circle: GridCircle = { x: 0, y: 0, radius: 10 };
const forwardFeedback: GridScrollFeedback = { height: 900, progress: 0.5, width: 1440 };

// Verifies grid path generation and the radial warp calculations.
describe("background grid geometry", () => {
    it("creates every horizontal and vertical grid line", () => {
        expect(createWarpedGridPaths(96, 48, null, 48)).toHaveLength(9);
    });

    it("keeps grid lines straight without a circle", () => {
        const [firstPath] = createWarpedGridPaths(96, 48, null, 48);
        const coordinates = pathCoordinates(firstPath);

        expect(coordinates.every(([x]) => x === -48)).toBe(true);
    });

    it("leaves points outside the warp falloff unchanged", () => {
        expect(warpGridPoint(211, 0, circle)).toEqual([211, 0]);
    });

    it("applies the maximum displacement at the circle edge", () => {
        expect(warpGridPoint(10, 0, circle)).toEqual([62, 0]);
    });

    it("reduces displacement with distance", () => {
        const [warpedX] = warpGridPoint(100, 0, circle);

        expect(warpedX).toBeCloseTo(115.73);
    });

    it("does not move a point at the circle center", () => {
        expect(warpGridPoint(0, 0, circle)).toEqual([0, 0]);
    });

    it("produces finite SVG coordinates near viewport edges", () => {
        const paths = createWarpedGridPaths(320, 180, { x: 320, y: 180, radius: 80 });

        expect(paths.every((path) => !path.includes("NaN") && !path.includes("Infinity"))).toBe(true);
    });

    it("keeps vertical coordinates unchanged when scroll feedback is active", () => {
        const [, restingY] = warpGridPoint(680, 850, null);
        const [, feedbackY] = warpGridPoint(680, 850, null, forwardFeedback);

        expect(feedbackY).toBe(restingY);
    });

    it("anchors forward and backward feedback to opposite viewport edges", () => {
        expect(scrollFeedbackDisplacementX(710, 875, forwardFeedback)).not.toBe(0);
        expect(scrollFeedbackDisplacementX(680, 50, forwardFeedback)).toBe(0);
        expect(scrollFeedbackDisplacementX(710, 25, { ...forwardFeedback, progress: -0.5 })).not.toBe(0);
        expect(scrollFeedbackDisplacementX(680, 850, { ...forwardFeedback, progress: -0.5 })).toBe(0);
    });

    it("caps the tear height at fifteen percent of the viewport", () => {
        const completeFeedback = { ...forwardFeedback, progress: 1 };

        expect(scrollFeedbackDisplacementX(720, 764, completeFeedback)).toBe(0);
        expect(scrollFeedbackDisplacementX(720, 766, completeFeedback)).not.toBe(0);
    });

    it("uses a one-to-one depth and half-width ratio", () => {
        const completeFeedback = { ...forwardFeedback, progress: 1 };

        expect(scrollFeedbackDisplacementX(854, 900, completeFeedback)).not.toBe(0);
        expect(scrollFeedbackDisplacementX(855, 900, completeFeedback)).toBe(0);
        expect(scrollFeedbackDisplacementX(787, 833, completeFeedback)).not.toBe(0);
        expect(scrollFeedbackDisplacementX(788, 833, completeFeedback)).toBe(0);
    });

    it("adds restrained layered crumpling to the geometric opening", () => {
        const displacement = scrollFeedbackDisplacementX(720, 900, { ...forwardFeedback, progress: 1 });

        expect(displacement).not.toBeCloseTo(135);
    });

    it("keeps the complete tear displacement restrained", () => {
        const displacements = Array.from({ length: 61 }, (_, index) => (
            scrollFeedbackDisplacementX(index * 24, 900, { ...forwardFeedback, progress: 1 })
        ));

        expect(Math.max(...displacements.map(Math.abs))).toBeLessThanOrEqual(235);
    });

});

// Extracts numeric points from one generated SVG path.
function pathCoordinates(path: string) {
    return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])] as const);
}
