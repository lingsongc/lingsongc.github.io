import { describe, expect, it } from "vitest";
import { initialSceneIdFromHash, sceneIdFromHash, sceneUrl } from "./sceneHistory";

// Verifies URL parsing and writing without a browser history dependency.
describe("scene history", () => {
    it("accepts every named scene hash", () => {
        expect(sceneIdFromHash("#experience")).toBe("experience");
        expect(sceneIdFromHash("#contact")).toBe("contact");
    });

    it("falls back to Home for absent or invalid hashes", () => {
        expect(initialSceneIdFromHash("")).toBe("home");
        expect(initialSceneIdFromHash("#unknown")).toBe("home");
    });

    it("keeps the route while writing a scene hash", () => {
        expect(sceneUrl("projects", { pathname: "/portfolio/", search: "?preview=1" }))
            .toBe("/portfolio/?preview=1#projects");
    });
});
