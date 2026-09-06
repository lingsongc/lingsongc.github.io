import { describe, expect, it } from "vitest";
import {
    elementDocumentTop,
    sectionIncomingTransitionRange,
    sectionRestingRange,
} from "./sectionRestingBounds";

// Verifies document, resting, and incoming transition boundary calculations.
describe("section resting bounds", () => {
    it("adds offsets across nested parent elements", () => {
        const root = { offsetTop: 100, offsetParent: null } as unknown as HTMLElement;
        const parent = { offsetTop: 250, offsetParent: root } as unknown as HTMLElement;
        const child = { offsetTop: 40, offsetParent: parent } as unknown as HTMLElement;

        expect(elementDocumentTop(child)).toBe(390);
    });

    it("calculates the resting interval for a tall container", () => {
        expect(sectionRestingRange(1000, 1350, 900)).toEqual({ start: 1000, end: 1450 });
    });

    it("uses a single resting point for a viewport-height container", () => {
        expect(sectionRestingRange(1000, 900, 900)).toEqual({ start: 1000, end: 1000 });
    });

    it("starts an incoming transition one viewport before the section", () => {
        expect(sectionIncomingTransitionRange(1800, 900)).toEqual({ start: 900, end: 1800 });
    });
});
