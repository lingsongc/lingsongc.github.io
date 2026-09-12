import { describe, expect, it } from "vitest";
import type { ImageDescriptor } from "../../types/images";
import { resolveImageState } from "./useMainCircle";

const about: ImageDescriptor = { src: "/about.jpg", alt: "" };
const experience: ImageDescriptor = { src: "/experience.jpg", alt: "" };

// Verifies the controller's pure image staging decisions.
describe("main circle controller", () => {
    it("hides the outgoing image while closing", () => {
        expect(resolveImageState({ about }, {
            currentSceneId: "about", requestedSceneId: "experience", phase: "closing",
        })).toEqual({ image: about, imageVisible: false });
    });

    it("stages the destination invisibly while moving", () => {
        expect(resolveImageState({ about, experience }, {
            currentSceneId: "about", requestedSceneId: "experience", phase: "moving",
        })).toEqual({ image: experience, imageVisible: false });
    });

    it("reveals the current image while opening and idle", () => {
        expect(resolveImageState({ experience }, {
            currentSceneId: "experience", requestedSceneId: "experience", phase: "opening",
        })).toEqual({ image: experience, imageVisible: true });
        expect(resolveImageState({ experience }, {
            currentSceneId: "experience", requestedSceneId: null, phase: "idle",
        })).toEqual({ image: experience, imageVisible: true });
    });
});
