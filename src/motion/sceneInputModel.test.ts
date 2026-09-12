import { describe, expect, it } from "vitest";
import {
    applyWheelIntent,
    canScrollScene,
    createWheelIntentState,
    firstScrollableOwnerIndex,
    isTerminalSceneDirection,
    keyboardSceneDirection,
    keyboardScrollDistance,
    normalizeWheelDelta,
    noteWheelActivity,
    releaseWheelNeutrality,
    releasedTouchDirection,
    touchDragIntent,
    touchVerticalProgress,
    WHEEL_INTENT_PAUSE_MS,
} from "./sceneInputModel";

// Verifies the pure deliberate-input model across devices and nested scroll owners.
describe("scene input model", () => {
    it("commits once after three deliberate wheel impulses", () => {
        let state = createWheelIntentState();
        let update = applyWheelIntent(state, 1, 0);
        state = update.state;
        update = applyWheelIntent(state, 1, 40);
        state = update.state;
        update = applyWheelIntent(state, 1, 80);
        expect(update.committedDirection).toBe("forward");
        expect(update.state.neutralRequired).toBe(true);
    });

    it("normalizes delta modes and clamps large impulses", () => {
        expect(normalizeWheelDelta(100, 0)).toBe(1);
        expect(normalizeWheelDelta(3, 1)).toBe(1);
        expect(normalizeWheelDelta(-1, 2)).toBe(-1);
        expect(normalizeWheelDelta(1200, 0)).toBe(1);
    });

    it("reduces intent on reversal and expires incomplete intent", () => {
        const forward = applyWheelIntent(createWheelIntentState(), 1, 0).state;
        expect(applyWheelIntent(forward, -0.5, 50).state.accumulation).toBe(0.5);
        expect(applyWheelIntent(forward, 1, WHEEL_INTENT_PAUSE_MS).state.accumulation).toBe(1);
    });

    it("holds post-transition momentum until a quiet interval", () => {
        let state = createWheelIntentState(true, 100);
        state = noteWheelActivity(state, 250);
        expect(releaseWheelNeutrality(state, 449)).toBe(state);
        expect(releaseWheelNeutrality(state, 450)).toEqual(createWheelIntentState());
        expect(applyWheelIntent(createWheelIntentState(true, 100), 1, 150).committedDirection).toBeNull();
    });

    it("locks touch direction and commits only at the release threshold", () => {
        expect(touchDragIntent(100, 100, 104, 94).axis).toBe("pending");
        expect(touchDragIntent(100, 100, 140, 80).axis).toBe("horizontal");
        expect(touchDragIntent(100, 200, 100, 104)).toEqual({ axis: "vertical", progress: 1 });
        expect(touchVerticalProgress(100, 104)).toBeCloseTo(-1 / 24);
        expect(releasedTouchDirection(0.99)).toBeNull();
        expect(releasedTouchDirection(-1)).toBe("backward");
    });

    it("maps keys and terminal boundaries", () => {
        expect(keyboardSceneDirection("ArrowDown")).toBe("forward");
        expect(keyboardSceneDirection("PageUp")).toBe("backward");
        expect(keyboardSceneDirection("Enter")).toBeNull();
        expect(isTerminalSceneDirection("home", "backward")).toBe(true);
        expect(isTerminalSceneDirection("contact", "forward")).toBe(true);
    });

    it("prioritizes the nearest viewport that can still scroll", () => {
        const top = { clientHeight: 400, scrollHeight: 800, scrollTop: 0 };
        const bottom = { clientHeight: 400, scrollHeight: 800, scrollTop: 400 };
        expect(canScrollScene(top, "forward")).toBe(true);
        expect(canScrollScene(bottom, "forward")).toBe(false);
        expect(firstScrollableOwnerIndex([bottom, top], "forward")).toBe(1);
        expect(keyboardScrollDistance("PageDown", 800)).toBe(680);
    });
});
