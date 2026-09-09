import { describe, expect, it } from "vitest";
import {
    createWarpedGridPaths,
    triangularGridDisplacement,
    warpGridPoint,
    type GridCircle,
} from "./backgroundGridGeometry";

const circle: GridCircle = { x: 0, y: 0, radius: 10 };

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

    it("keeps triangular displacement at zero without resistance", () => {
        expect(triangularGridDisplacement(720, 900, {
            width: 1440,
            height: 900,
            progress: 0,
        })).toEqual([0, 0]);
    });

    it("lifts 32px from the bottom centre at full forward resistance", () => {
        expect(triangularGridDisplacement(720, 900, {
            width: 1440,
            height: 900,
            progress: 1,
        })).toEqual([0, -32]);
    });

    it("mirrors forward and backward influence across the viewport", () => {
        const forward = triangularGridDisplacement(620, 750, {
            width: 1440,
            height: 900,
            progress: 0.75,
        });
        const backward = triangularGridDisplacement(620, 150, {
            width: 1440,
            height: 900,
            progress: -0.75,
        });

        expect(forward[0]).toBe(0);
        expect(backward[0]).toBe(0);
        expect(forward[1]).toBeCloseTo(-backward[1]);
    });

    it("is horizontally symmetric around the edge centre", () => {
        const left = triangularGridDisplacement(620, 750, {
            width: 1440,
            height: 900,
            progress: 1,
        });
        const right = triangularGridDisplacement(820, 750, {
            width: 1440,
            height: 900,
            progress: 1,
        });
        expect(left).toEqual(right);
    });

    it("leaves points beyond the triangular influence fixed", () => {
        expect(triangularGridDisplacement(0, 900, {
            width: 1440,
            height: 900,
            progress: 1,
        })).toEqual([0, 0]);
        expect(triangularGridDisplacement(720, 0, {
            width: 1440,
            height: 900,
            progress: 1,
        })).toEqual([0, 0]);
    });

    it("caps combined circle and triangular displacement", () => {
        const [warpedX, warpedY] = warpGridPoint(720, 700, {
            x: 720,
            y: 752,
            radius: 52,
        }, {
            width: 1440,
            height: 900,
            progress: 1,
        });
        expect(Math.hypot(warpedX - 720, warpedY - 700)).toBeCloseTo(64);
    });
});

// Extracts numeric points from one generated SVG path.
function pathCoordinates(path: string) {
    return [...path.matchAll(/[ML](-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)]
        .map((match) => [Number(match[1]), Number(match[2])] as const);
}
