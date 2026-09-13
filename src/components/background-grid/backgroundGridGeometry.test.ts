import { describe, expect, it } from "vitest";
import {
    createScrollTearRevealPaths,
    createWarpedGridPaths,
    easeOutScrollProgress,
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

    it("uses an equilateral depth and half-width ratio", () => {
        const completeFeedback = { ...forwardFeedback, progress: 1 };

        expect(scrollFeedbackDisplacementX(797, 900, completeFeedback)).not.toBe(0);
        expect(scrollFeedbackDisplacementX(798, 900, completeFeedback)).toBe(0);
        expect(scrollFeedbackDisplacementX(759, 833, completeFeedback)).not.toBe(0);
        expect(scrollFeedbackDisplacementX(760, 833, completeFeedback)).toBe(0);
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

    it("front-loads visual growth while preserving the complete cap", () => {
        expect(easeOutScrollProgress(1 / 3)).toBeCloseTo(5 / 9);
        expect(easeOutScrollProgress(2 / 3)).toBeCloseTo(8 / 9);
        expect(easeOutScrollProgress(1)).toBe(1);
    });

    it("allows only a small horizontal stretch beyond complete progress", () => {
        const complete = scrollFeedbackDisplacementX(720, 900, { ...forwardFeedback, progress: 1 });
        const stretched = scrollFeedbackDisplacementX(720, 900, { ...forwardFeedback, progress: 1.04 });

        expect(stretched).toBeGreaterThan(complete);
        expect(stretched).toBeCloseTo(complete * 1.04);
    });

    it("builds the red reveal inside the same capped tear boundary", () => {
        expect(createScrollTearRevealPaths(1440, 900, 0)).toEqual({
            fill: "",
            leftSeam: "",
            rightSeam: "",
        });
        const tearPaths = createScrollTearRevealPaths(1440, 900, 1);
        const coordinates = pathCoordinates(tearPaths.fill);
        const xValues = coordinates.map(([x]) => x);
        const yValues = coordinates.map(([, y]) => y);

        expect(Math.min(...xValues)).toBeLessThan(720);
        expect(Math.max(...xValues)).toBeGreaterThan(720);
        expect(Math.min(...yValues)).toBe(765);
        expect(Math.max(...yValues)).toBe(900);
        expect(pathCoordinates(tearPaths.leftSeam).map(([, y]) => y)).toEqual(
            pathCoordinates(tearPaths.rightSeam).map(([, y]) => y),
        );
    });

});

// Extracts numeric points from one generated SVG path.
function pathCoordinates(path: string) {
    return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])] as const);
}
