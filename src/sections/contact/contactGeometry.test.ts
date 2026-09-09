import { describe, expect, it } from "vitest";
import {
    contactFinalOffset,
    contactFittedFinalOffset,
    contactInitialOffset,
} from "./contactGeometry";

// Verifies the radial start and end positions of Contact profile circles.
describe("contact geometry", () => {
    it("scales final offsets with the orbit size", () => {
        expect(contactFinalOffset([-0.78, 0.26], 500, 0)).toBe(-390);
        expect(contactFinalOffset([-0.78, 0.26], 500, 1)).toBe(130);
    });

    it("keeps the initial circle inside the main circle", () => {
        const offset = [-0.78, 0.26] as const;
        const x = contactInitialOffset(offset, 0.36, 500, 0);
        const y = contactInitialOffset(offset, 0.36, 500, 1);

        expect(Math.hypot(x, y)).toBeCloseTo(150);
    });

    it("keeps final profile circles inside narrow viewport edges", () => {
        expect(contactFittedFinalOffset([-0.78, 0.26], 0.36, 179, 320, 700, 0))
            .toBeCloseTo(-123.78);
        expect(contactFittedFinalOffset([0.78, -0.28], 0.31, 179, 320, 700, 0))
            .toBeCloseTo(128.255);
    });

    it("preserves the movement direction", () => {
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 0)).toBeLessThan(0);
        expect(contactInitialOffset([-0.78, 0.26], 0.36, 500, 1)).toBeGreaterThan(0);
    });

    it("handles a zero-length direction safely", () => {
        expect(contactInitialOffset([0, 0], 0.3, 500, 0)).toBe(0);
        expect(contactInitialOffset([0, 0], 0.3, 500, 1)).toBe(0);
    });
});
