import { describe, expect, it } from "vitest";
import {
    applyWheelIntent,
    createWheelIntentState,
    normalizeWheelDelta,
    noteWheelActivity,
    releaseWheelNeutrality,
    wheelCompositionOffset,
    wheelIntentProgress,
    WHEEL_INTENT_PAUSE_MS,
    WHEEL_INTENT_RETURN_MS,
} from "./wheelIntent";

// Verifies stable wheel intent across device delta modes and gesture timing.
describe("wheel intent", () => {
    it("commits after three deliberate pixel-mode mouse notches", () => {
        let state = createWheelIntentState();
        let update = applyWheelIntent(state, normalizeWheelDelta(100, 0), 0);
        state = update.state;
        update = applyWheelIntent(state, normalizeWheelDelta(100, 0), 40);
        state = update.state;
        update = applyWheelIntent(state, normalizeWheelDelta(100, 0), 80);

        expect(update.committedDirection).toBe("forward");
        expect(wheelIntentProgress(update.state, 80)).toBe(0);
        expect(update.state.neutralRequired).toBe(true);
    });

    it("accumulates many small trackpad deltas to the same threshold", () => {
        let state = createWheelIntentState();
        let committedDirection = null;
        for (let index = 0; index < 30; index += 1) {
            const update = applyWheelIntent(state, normalizeWheelDelta(10, 0), index * 5);
            state = update.state;
            committedDirection = update.committedDirection;
        }
        expect(committedDirection).toBe("forward");
    });

    it("clamps one large delta to one impulse", () => {
        const update = applyWheelIntent(
            createWheelIntentState(),
            normalizeWheelDelta(-1200, 0),
            0,
        );
        expect(update.committedDirection).toBeNull();
        expect(wheelIntentProgress(update.state, 0)).toBeCloseTo(-1 / 3);
    });

    it("normalizes line and page delta modes", () => {
        expect(normalizeWheelDelta(3, 1)).toBe(1);
        expect(normalizeWheelDelta(-1, 2)).toBe(-1);
    });

    it("reduces existing intent before accumulating a reversal", () => {
        const forward = applyWheelIntent(createWheelIntentState(), 1, 0).state;
        const reversed = applyWheelIntent(forward, -0.5, 50).state;
        expect(wheelIntentProgress(reversed, 50)).toBeCloseTo(1 / 6);
    });

    it("holds incomplete input, then returns without overshoot", () => {
        const state = applyWheelIntent(createWheelIntentState(), 1, 100).state;
        expect(wheelIntentProgress(state, 100 + WHEEL_INTENT_PAUSE_MS)).toBeCloseTo(1 / 3);
        expect(wheelIntentProgress(
            state,
            100 + WHEEL_INTENT_PAUSE_MS + WHEEL_INTENT_RETURN_MS / 2,
        )).toBeCloseTo(1 / 6);
        expect(wheelIntentProgress(
            state,
            100 + WHEEL_INTENT_PAUSE_MS + WHEEL_INTENT_RETURN_MS,
        )).toBe(0);
    });

    it("maps bounded forward and backward resistance to the 24px composition pull", () => {
        expect(wheelCompositionOffset(1)).toBe(-24);
        expect(wheelCompositionOffset(-1)).toBe(24);
        expect(wheelCompositionOffset(2)).toBe(-24);
    });

    it("requires momentum to become neutral after a transition", () => {
        let state = createWheelIntentState(true, 100);
        state = noteWheelActivity(state, 250);
        expect(releaseWheelNeutrality(state, 449)).toBe(state);
        expect(releaseWheelNeutrality(state, 450)).toEqual(createWheelIntentState());
    });

    it("ignores momentum while post-transition neutrality is required", () => {
        const state = createWheelIntentState(true, 100);
        const update = applyWheelIntent(state, 1, 150);
        expect(update.committedDirection).toBeNull();
        expect(update.state.lastInputAt).toBe(150);
        expect(wheelIntentProgress(update.state, 150)).toBe(0);
    });
});
