import { describe, expect, it } from "vitest";
import {
    canScrollScene,
    firstScrollableOwnerIndex,
    hardEdgeResistance,
    isTerminalSceneDirection,
    keyboardSceneDirection,
    keyboardScrollDistance,
    releasedTouchDirection,
    returningResistance,
    touchDragIntent,
    touchVerticalProgress,
} from "./sceneInputIntent";

// Verifies deliberate touch, keyboard, and terminal-edge input calculations.
describe("scene input intent", () => {
    it("waits for the touch axis lock before publishing resistance", () => {
        expect(touchDragIntent(100, 100, 104, 94)).toEqual({ axis: "pending", progress: 0 });
    });

    it("rejects horizontal-dominant touch movement", () => {
        expect(touchDragIntent(100, 100, 140, 80)).toEqual({ axis: "horizontal", progress: 0 });
    });

    it("maps an upward 96px drag to full forward resistance", () => {
        expect(touchDragIntent(100, 200, 100, 104)).toEqual({ axis: "vertical", progress: 1 });
    });

    it("maps and clamps backward touch resistance", () => {
        expect(touchDragIntent(100, 100, 100, 244)).toEqual({ axis: "vertical", progress: -1 });
    });

    it("returns a locked vertical gesture to neutral when it crosses its origin", () => {
        expect(touchVerticalProgress(100, 100)).toBe(0);
        expect(touchVerticalProgress(100, 104)).toBeCloseTo(-1 / 24);
    });

    it("commits touch direction only on release at the threshold", () => {
        expect(releasedTouchDirection(0.99)).toBeNull();
        expect(releasedTouchDirection(-0.99)).toBeNull();
        expect(releasedTouchDirection(1)).toBe("forward");
        expect(releasedTouchDirection(-1)).toBe("backward");
    });

    it("maps only the approved adjacent navigation keys", () => {
        expect(keyboardSceneDirection("ArrowDown")).toBe("forward");
        expect(keyboardSceneDirection("PageDown")).toBe("forward");
        expect(keyboardSceneDirection("ArrowUp")).toBe("backward");
        expect(keyboardSceneDirection("PageUp")).toBe("backward");
        expect(keyboardSceneDirection("ArrowRight")).toBeNull();
        expect(keyboardSceneDirection("Enter")).toBeNull();
    });

    it("detects only unavailable Home and Contact directions", () => {
        expect(isTerminalSceneDirection("home", "backward")).toBe(true);
        expect(isTerminalSceneDirection("home", "forward")).toBe(false);
        expect(isTerminalSceneDirection("contact", "forward")).toBe(true);
        expect(isTerminalSceneDirection("contact", "backward")).toBe(false);
    });

    it("preserves native scrolling until its directional boundary", () => {
        const fitting = { clientHeight: 900, scrollHeight: 900, scrollTop: 0 };
        const top = { clientHeight: 900, scrollHeight: 1200, scrollTop: 0 };
        const middle = { clientHeight: 900, scrollHeight: 1200, scrollTop: 150 };
        const bottom = { clientHeight: 900, scrollHeight: 1200, scrollTop: 300 };

        expect(canScrollScene(fitting, "forward")).toBe(false);
        expect(canScrollScene(top, "forward")).toBe(true);
        expect(canScrollScene(top, "backward")).toBe(false);
        expect(canScrollScene(middle, "forward")).toBe(true);
        expect(canScrollScene(middle, "backward")).toBe(true);
        expect(canScrollScene(bottom, "forward")).toBe(false);
    });

    it("gives the nearest scroll owner priority before the Section viewport", () => {
        const top = { clientHeight: 400, scrollHeight: 800, scrollTop: 0 };
        const bottom = { clientHeight: 400, scrollHeight: 800, scrollTop: 400 };

        expect(firstScrollableOwnerIndex([top, bottom], "forward")).toBe(0);
        expect(firstScrollableOwnerIndex([bottom, top], "forward")).toBe(1);
        expect(firstScrollableOwnerIndex([bottom, bottom], "forward")).toBeNull();
    });

    it("uses line-scale Arrow scrolling and viewport-scale Page scrolling", () => {
        expect(keyboardScrollDistance("ArrowDown", 800)).toBe(40);
        expect(keyboardScrollDistance("PageDown", 800)).toBe(680);
    });

    it("caps repeated terminal intent at 35 percent resistance", () => {
        expect(hardEdgeResistance("forward", 1)).toBe(0.35);
        expect(hardEdgeResistance("forward", 3)).toBe(0.35);
        expect(hardEdgeResistance("backward", 1)).toBe(-0.35);
    });

    it("returns hard-edge and touch resistance without overshoot", () => {
        expect(returningResistance(0.8, 0, 300)).toBe(0.8);
        expect(returningResistance(0.8, 150, 300)).toBeCloseTo(0.4);
        expect(returningResistance(0.8, 300, 300)).toBe(0);
        expect(returningResistance(-0.8, 450, 300)).toBeCloseTo(0);
    });
});
