import { describe, expect, it } from "vitest";
import { fitProjectAngleToViewport, projectOrbitAngle } from "./projectOrbitGeometry";

// Verifies deterministic project angles and viewport safety corrections.
describe("project orbit geometry", () => {
    it("returns the same angle for the same project", () => {
        expect(projectOrbitAngle("modulo", 0, 4)).toBe(projectOrbitAngle("modulo", 0, 4));
    });

    it("keeps ID-based variation within its allowed range", () => {
        const projectCount = 4;

        ["alpha", "beta", "gamma", "delta"].forEach((id, index) => {
            const baseAngle = 90 + index * 90;
            expect(Math.abs(projectOrbitAngle(id, index, projectCount) - baseAngle)).toBeLessThanOrEqual(18);
        });
    });

    it("distributes projects into separate orbit sectors", () => {
        const angles = ["alpha", "beta", "gamma", "delta"]
            .map((id, index) => projectOrbitAngle(id, index, 4));

        expect(new Set(angles).size).toBe(4);
    });

    it("normalizes angles outside one full rotation", () => {
        expect(fitProjectAngleToViewport(-90, 100, 10, 300, 300)).toBe(270);
        expect(fitProjectAngleToViewport(450, 100, 10, 300, 300)).toBe(90);
    });

    it("leaves vertically safe angles unchanged", () => {
        expect(fitProjectAngleToViewport(90, 500, 50, 1200, 600)).toBe(90);
        expect(fitProjectAngleToViewport(270, 500, 50, 1200, 600)).toBe(270);
    });

    it("moves an unsafe top angle to the visible boundary", () => {
        const safeOffset = Math.acos(249 / 500) * 180 / Math.PI;

        expect(fitProjectAngleToViewport(0, 500, 50, 1200, 600)).toBeCloseTo(safeOffset, 1);
    });

    it("increases the correction for larger planets", () => {
        const smallPlanetAngle = fitProjectAngleToViewport(0, 500, 20, 1200, 600);
        const largePlanetAngle = fitProjectAngleToViewport(0, 500, 80, 1200, 600);

        expect(largePlanetAngle).toBeGreaterThan(smallPlanetAngle);
    });

    it("moves a side planet inside a narrow viewport without shrinking its ring", () => {
        const angle = fitProjectAngleToViewport(90, 284, 30, 320, 700);
        const horizontalOffset = Math.sin(angle * Math.PI / 180) * 284;

        expect(Math.abs(horizontalOffset)).toBeLessThanOrEqual(129.5);
    });

    it("returns the nearest safe side across circular wraparound", () => {
        const angle = fitProjectAngleToViewport(359, 500, 50, 1200, 600);
        expect(angle).toBeGreaterThan(290);
        expect(angle).toBeLessThan(310);
    });
});
