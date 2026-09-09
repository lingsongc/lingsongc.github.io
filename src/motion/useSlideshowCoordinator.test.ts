import { describe, expect, it } from "vitest";
import type { SceneRequest } from "../types/scene";
import {
    createSlideshowCoordinator,
    type SlideshowTravelDriver,
} from "./useSlideshowCoordinator";

const aboutToExperience: SceneRequest = {
    kind: "direct",
    destinationSceneId: "experience",
    source: "navigation",
};

// Verifies Section-owned completion around a mocked direct travel stage.
describe("slideshow coordinator", () => {
    it("orchestrates About close, travel, and Experience open without scrolling", () => {
        const travel = controlledTravel();
        const coordinator = createSlideshowCoordinator("about", { startTravel: travel.start });

        expect(coordinator.requestScene(aboutToExperience).status).toBe("accepted");
        expect(coordinator.getSnapshot()).toMatchObject({
            activeSceneId: "about",
            currentSceneId: "about",
            phase: "closing",
            requestedSceneId: "experience",
        });

        coordinator.completeSceneTransition("about", "closing");
        expect(coordinator.getSnapshot()).toMatchObject({
            activeSceneId: null,
            phase: "moving",
            travelProgress: 0,
        });

        travel.progress(0.4);
        expect(coordinator.getSnapshot().travelProgress).toBe(0.4);
        travel.complete();
        expect(coordinator.getSnapshot()).toMatchObject({
            activeSceneId: "experience",
            currentSceneId: "experience",
            phase: "opening",
            travelProgress: 1,
        });

        coordinator.completeSceneTransition("experience", "opening");
        expect(coordinator.getSnapshot()).toMatchObject({
            activeSceneId: "experience",
            currentSceneId: "experience",
            phase: "idle",
            requestedSceneId: null,
            travelProgress: 0,
        });
    });

    it("ignores busy and stale Section completion without queuing work", () => {
        const travel = controlledTravel();
        const coordinator = createSlideshowCoordinator("about", { startTravel: travel.start });
        coordinator.requestScene(aboutToExperience);

        expect(coordinator.requestScene({
            kind: "direct",
            destinationSceneId: "contact",
            source: "history",
        })).toEqual({ status: "ignored", reason: "busy" });
        coordinator.completeSceneTransition("projects", "closing");
        expect(coordinator.getSnapshot().phase).toBe("closing");
    });

    it("cancels active travel and ignores late driver callbacks after disposal", () => {
        const travel = controlledTravel();
        const coordinator = createSlideshowCoordinator("about", { startTravel: travel.start });
        coordinator.requestScene(aboutToExperience);
        coordinator.completeSceneTransition("about", "closing");
        coordinator.dispose();
        travel.progress(0.8);
        travel.complete();

        expect(travel.cancelled()).toBe(true);
        expect(coordinator.getSnapshot().phase).toBe("moving");
    });

    it.each(["closing", "moving", "opening"] as const)(
        "settles the requested destination and ignores stale callbacks from %s",
        (phase) => {
            const travel = controlledTravel();
            const coordinator = createSlideshowCoordinator("about", { startTravel: travel.start });
            coordinator.requestScene(aboutToExperience);
            if (phase !== "closing") coordinator.completeSceneTransition("about", "closing");
            if (phase === "opening") travel.complete();

            expect(coordinator.recover("resize")).toBe(true);
            expect(coordinator.getSnapshot()).toMatchObject({
                currentSceneId: "experience",
                phase: "idle",
                requestedSceneId: null,
                settledVersion: 1,
                travelProgress: 0,
            });

            travel.complete();
            coordinator.completeSceneTransition("experience", "opening");
            expect(coordinator.getSnapshot().phase).toBe("idle");
        },
    );

    it("settles an accepted request immediately when reduced motion is active", () => {
        const travel = controlledTravel();
        const coordinator = createSlideshowCoordinator("about", {
            reducedMotion: true,
            startTravel: travel.start,
        });

        expect(coordinator.requestScene(aboutToExperience)).toMatchObject({ status: "accepted" });
        expect(coordinator.getSnapshot()).toMatchObject({
            activeSceneId: "experience",
            currentSceneId: "experience",
            phase: "idle",
            requestedSceneId: null,
            settledVersion: 1,
            travelProgress: 0,
        });
        expect(travel.cancelled()).toBe(false);
    });
});

// Provides manual progress and completion controls for deterministic phase tests.
function controlledTravel() {
    let callbacks: Parameters<SlideshowTravelDriver>[0] | null = null;
    let wasCancelled = false;
    return {
        start: ((nextCallbacks) => {
            callbacks = nextCallbacks;
            return () => { wasCancelled = true; };
        }) satisfies SlideshowTravelDriver,
        progress(value: number) {
            callbacks?.onProgress(value);
        },
        complete() {
            callbacks?.onComplete();
        },
        cancelled: () => wasCancelled,
    };
}
