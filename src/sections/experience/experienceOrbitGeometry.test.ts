import { describe, expect, it } from "vitest";
import {
    experienceOrbitEntryAngle,
    experienceOrbitGeometry,
    experienceOrbitPoint,
    experienceOrbitPointIsVisible,
    experienceOrbitScrollDistance,
    experienceOrbitScrollTop,
} from "./experienceOrbitGeometry";

// Verifies timeline orbit positions, visibility, and scroll calculations.
describe("experience orbit geometry", () => {
    it("places key angles at the expected ellipse positions", () => {
        const [rightX, rightY] = numericPoint(experienceOrbitPoint(0));
        const [bottomX, bottomY] = numericPoint(experienceOrbitPoint(90));
        const [leftX, leftY] = numericPoint(experienceOrbitPoint(180));

        expect(rightX).toBeCloseTo(99.1667, 3);
        expect(rightY).toBeCloseTo(50);
        expect(bottomX).toBeCloseTo(50);
        expect(bottomY).toBeCloseTo(97);
        expect(leftX).toBeCloseTo(0.8333, 3);
        expect(leftY).toBeCloseTo(50);
    });

    it("places opposite angles on opposite sides of the ellipse", () => {
        const [right] = numericPoint(experienceOrbitPoint(0));
        const [left] = numericPoint(experienceOrbitPoint(180));

        expect(right - 50).toBeCloseTo(50 - left);
    });

    it("includes exact visibility boundaries", () => {
        expect(experienceOrbitPointIsVisible(35)).toBe(true);
        expect(experienceOrbitPointIsVisible(179)).toBe(true);
    });

    it("excludes angles beyond the visibility boundaries", () => {
        expect(experienceOrbitPointIsVisible(34.99)).toBe(false);
        expect(experienceOrbitPointIsVisible(179.01)).toBe(false);
    });

    it("moves the selected entry to the focus angle", () => {
        expect(experienceOrbitEntryAngle(2, 2)).toBe(experienceOrbitGeometry.focusAngle);
        expect(experienceOrbitEntryAngle(3, 2)).toBe(
            experienceOrbitGeometry.focusAngle - experienceOrbitGeometry.angleStep,
        );
    });

    it("calculates entry and collection scroll distances", () => {
        expect(experienceOrbitScrollTop(2)).toBe(224);
        expect(experienceOrbitScrollDistance(4)).toBe(336);
        expect(experienceOrbitScrollDistance(0)).toBe(0);
    });

    it("ends a collection at its final entry position", () => {
        const entryCount = 4;

        expect(experienceOrbitScrollDistance(entryCount)).toBe(experienceOrbitScrollTop(entryCount - 1));
    });
});

// Converts percentage strings into numbers for geometric comparisons.
function numericPoint(point: { left: string; top: string }) {
    return [Number.parseFloat(point.left), Number.parseFloat(point.top)];
}
