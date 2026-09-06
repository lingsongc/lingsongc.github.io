import { describe, expect, it } from "vitest";
import { mainCircleStateAtScroll, type MainCircleHandoff, type MainCircleState } from "./mainCircleTransitionState";

const homeState: MainCircleState = { width: 350, top: 450, left: 720 };
const aboutState: MainCircleState = { width: 1400, top: 450, left: -140 };
const experienceState: MainCircleState = { width: 620, top: 575, left: 920 };
const handoffs: readonly MainCircleHandoff[] = [
    { start: 450, end: 1350, from: homeState, to: aboutState },
    { start: 1800, end: 2700, from: aboutState, to: experienceState },
];

// Verifies deterministic circle geometry for scrolling and direct section jumps.
describe("main circle transition state", () => {
    it("keeps the initial geometry before the first handoff", () => {
        expect(mainCircleStateAtScroll(200, homeState, handoffs)).toEqual(homeState);
    });

    it("interpolates every measurement during a handoff", () => {
        expect(mainCircleStateAtScroll(900, homeState, handoffs)).toEqual({
            width: 875,
            top: 450,
            left: 290,
        });
    });

    it("holds the completed geometry between handoffs", () => {
        expect(mainCircleStateAtScroll(1600, homeState, handoffs)).toEqual(aboutState);
    });

    it("lands directly on the requested section geometry", () => {
        expect(mainCircleStateAtScroll(2700, homeState, handoffs)).toEqual(experienceState);
    });

    it("switches between endpoints when reduced motion is preferred", () => {
        expect(mainCircleStateAtScroll(800, homeState, handoffs, true)).toEqual(homeState);
        expect(mainCircleStateAtScroll(1000, homeState, handoffs, true)).toEqual(aboutState);
    });
});
