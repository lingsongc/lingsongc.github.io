import { describe, expect, it } from "vitest";
import type { MainCircleEndpoint } from "../types/mainCircle";
import {
    MAIN_CIRCLE_TRAVEL_DURATION_MS,
    mainCircleTravelAtTime,
} from "./mainCircleTravel";

const aboutEndpoint: MainCircleEndpoint = { width: 1440, top: 450, left: -144 };
const experienceEndpoint: MainCircleEndpoint = { width: 621, top: 602, left: 1047 };
const contactEndpoint: MainCircleEndpoint = { width: 504, top: 450, left: 720 };

// Verifies direct endpoint travel and its fixed normalized duration.
describe("main circle travel", () => {
    it("uses the provisional constant one-second travel duration", () => {
        expect(MAIN_CIRCLE_TRAVEL_DURATION_MS).toBe(1000);
        expect(mainCircleTravelAtTime(aboutEndpoint, experienceEndpoint, 500).easedProgress).toBe(0.5);
    });

    it("interpolates width, top, and left with one straight-path progress", () => {
        expect(mainCircleTravelAtTime(aboutEndpoint, experienceEndpoint, 500)).toEqual({
            endpoint: {
                width: 1030.5,
                top: 526,
                left: 451.5,
            },
            easedProgress: 0.5,
        });
    });

    it("uses an injected ease for geometry and shared rail progress", () => {
        const snapshot = mainCircleTravelAtTime(
            aboutEndpoint,
            experienceEndpoint,
            500,
            (progress) => progress * progress,
        );

        expect(snapshot.easedProgress).toBe(0.25);
        expect(snapshot.endpoint).toEqual({
            width: 1235.25,
            top: 488,
            left: 153.75,
        });
    });

    it("clamps elapsed time and easing output to the requested endpoints", () => {
        expect(mainCircleTravelAtTime(aboutEndpoint, contactEndpoint, -100).endpoint).toEqual(aboutEndpoint);
        expect(mainCircleTravelAtTime(aboutEndpoint, contactEndpoint, 1200).endpoint).toEqual(contactEndpoint);
        expect(mainCircleTravelAtTime(aboutEndpoint, contactEndpoint, 500, () => 2).endpoint).toEqual(contactEndpoint);
    });

    it("normalizes adjacent and distant travel to the same duration", () => {
        const adjacent = mainCircleTravelAtTime(aboutEndpoint, experienceEndpoint, 750);
        const distant = mainCircleTravelAtTime(aboutEndpoint, contactEndpoint, 750);

        expect(adjacent.easedProgress).toBe(0.75);
        expect(distant.easedProgress).toBe(0.75);
        expect(mainCircleTravelAtTime(aboutEndpoint, experienceEndpoint, 1000).endpoint).toEqual(experienceEndpoint);
        expect(mainCircleTravelAtTime(aboutEndpoint, contactEndpoint, 1000).endpoint).toEqual(contactEndpoint);
    });
});
