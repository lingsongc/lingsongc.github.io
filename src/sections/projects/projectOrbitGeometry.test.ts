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
        expect(fitProjectAngleToViewport(-90, 100, 10, 300)).toBe(270);
        expect(fitProjectAngleToViewport(450, 100, 10, 300)).toBe(90);
    });

    it("leaves vertically safe angles unchanged", () => {
        expect(fitProjectAngleToViewport(90, 500, 50, 600)).toBe(90);
        expect(fitProjectAngleToViewport(270, 500, 50, 600)).toBe(270);
    });

    it("moves an unsafe top angle to the visible boundary", () => {
        const safeOffset = Math.acos(249 / 500) * 180 / Math.PI;

        expect(fitProjectAngleToViewport(0, 500, 50, 600)).toBeCloseTo(safeOffset);
    });

    it("increases the correction for larger planets", () => {
        const smallPlanetAngle = fitProjectAngleToViewport(0, 500, 20, 600);
        const largePlanetAngle = fitProjectAngleToViewport(0, 500, 80, 600);

        expect(largePlanetAngle).toBeGreaterThan(smallPlanetAngle);
    });
});
