import { describe, expect, it } from "vitest";
import type { ImageDescriptor } from "../types/images";
import {
    publishSceneImageDescriptor,
    resolveMainCircleImageLifecycle,
    type SceneImageRegistry,
} from "./useMainCircleImageLifecycle";

const aboutImage: ImageDescriptor = { src: "/about.jpg", alt: "" };
const experienceImage: ImageDescriptor = { src: "/experience.jpg", alt: "" };
const alternateExperienceImage: ImageDescriptor = { src: "/experience-2.jpg", alt: "" };

// Verifies blank travel, destination staging, and owner-safe descriptor publication.
describe("main circle image lifecycle", () => {
    it("fades the current image during closing", () => {
        const snapshot = resolveMainCircleImageLifecycle({ about: aboutImage }, {
            currentSceneId: "about",
            requestedSceneId: "experience",
            phase: "closing",
        });

        expect(snapshot).toEqual({ image: aboutImage, imageVisible: false });
    });

    it("stages the requested image invisibly throughout movement", () => {
        const snapshot = resolveMainCircleImageLifecycle({
            about: aboutImage,
            experience: experienceImage,
        }, {
            currentSceneId: "about",
            requestedSceneId: "experience",
            phase: "moving",
        });

        expect(snapshot).toEqual({ image: experienceImage, imageVisible: false });
    });

    it("reveals the arrived Scene image during opening and resting", () => {
        const images = { experience: experienceImage };
        expect(resolveMainCircleImageLifecycle(images, {
            currentSceneId: "experience",
            requestedSceneId: "experience",
            phase: "opening",
        })).toEqual({ image: experienceImage, imageVisible: true });
        expect(resolveMainCircleImageLifecycle(images, {
            currentSceneId: "experience",
            requestedSceneId: null,
            phase: "idle",
        })).toEqual({ image: experienceImage, imageVisible: true });
    });

    it("ignores stale clears while preserving later Section selections", () => {
        let images: SceneImageRegistry = {};
        images = publishSceneImageDescriptor(images, "about", aboutImage);
        images = publishSceneImageDescriptor(images, "experience", experienceImage);
        images = publishSceneImageDescriptor(images, "about", null);
        images = publishSceneImageDescriptor(images, "experience", alternateExperienceImage);

        expect(images).toEqual({
            about: aboutImage,
            experience: alternateExperienceImage,
        });
    });
});
