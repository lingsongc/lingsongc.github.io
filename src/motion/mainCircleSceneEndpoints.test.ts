import { describe, expect, it } from "vitest";
import { sceneOrder, type SceneId } from "../types/scene";
import {
    resolveMainCircleSceneEndpoint,
    resolveMainCircleSceneEndpoints,
    type MainCircleSceneLayout,
} from "./mainCircleSceneEndpoints";

const laptopLayout: MainCircleSceneLayout = {
    viewportWidth: 1440,
    viewportHeight: 900,
    homeCircleWidth: 352,
    experienceCenter: {
        top: 602,
        left: 1047,
    },
    navigationRailLeft: 1320,
};

// Verifies complete scene-keyed endpoints without DOM or scroll measurements.
describe("main circle scene endpoints", () => {
    it("resolves complete laptop geometry for all six scenes", () => {
        const endpoints = resolveMainCircleSceneEndpoints(laptopLayout);

        expect(endpoints).toMatchObject({
            home: { width: 352, top: 450, left: 720 },
            about: { width: 1440, top: 450, left: -144 },
            experience: { width: 621, top: 602, left: 1047 },
            projects: { width: 489.6, top: 450, left: 720 },
            skills: { width: 810, top: 450, left: 870 },
            contact: { top: 450, left: 720 },
        });
        expect(endpoints.contact.width).toBeCloseTo(504);
    });

    it("includes exactly the shared ordered scene identities", () => {
        expect(Object.keys(resolveMainCircleSceneEndpoints(laptopLayout))).toEqual(sceneOrder);
    });

    it.each(sceneOrder)("resolves numeric width, top, and left for %s", (sceneId) => {
        const endpoint = resolveMainCircleSceneEndpoint(sceneId, laptopLayout);

        expect(Number.isFinite(endpoint.width)).toBe(true);
        expect(Number.isFinite(endpoint.top)).toBe(true);
        expect(Number.isFinite(endpoint.left)).toBe(true);
    });

    it("uses current external layout measurements for measured endpoints", () => {
        const measuredLayout: MainCircleSceneLayout = {
            ...laptopLayout,
            homeCircleWidth: 300,
            experienceCenter: { top: 540, left: 980 },
            navigationRailLeft: 1260,
        };

        expect(resolveMainCircleSceneEndpoint("home", measuredLayout).width).toBe(300);
        expect(resolveMainCircleSceneEndpoint("experience", measuredLayout)).toMatchObject({
            top: 540,
            left: 980,
        });
        expect(resolveMainCircleSceneEndpoint("skills", measuredLayout).left).toBe(810);
    });

    it("keeps direct endpoint lookup typed to the complete scene union", () => {
        const sceneId: SceneId = "projects";
        expect(resolveMainCircleSceneEndpoint(sceneId, laptopLayout)).toEqual({
            width: 489.6,
            top: 450,
            left: 720,
        });
    });
});
