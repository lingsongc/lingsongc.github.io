import { describe, expect, it } from "vitest";
import {
    aboutCircleLeft,
    aboutCircleSize,
    contactCircleSize,
    experienceCircleSize,
    homeCircleSize,
    projectCircleSize,
    skillsCircleLeft,
    skillsCircleSize,
} from "./mainCircleGeometry";

// Verifies responsive main-circle calculations without rendering the page.
describe("main circle geometry", () => {
    it("matches the responsive Home CSS clamp", () => {
        expect(homeCircleSize(320, 16)).toBe(128);
        expect(homeCircleSize(1000, 16)).toBe(280);
        expect(homeCircleSize(1440, 16)).toBe(352);
    });

    it("uses viewport width for the mobile About circle", () => {
        expect(aboutCircleSize(768, 900)).toBeCloseTo(729.6);
    });

    it("uses viewport height for the desktop About circle", () => {
        expect(aboutCircleSize(769, 900)).toBe(1440);
    });

    it("positions the About circle with the responsive offset", () => {
        expect(aboutCircleLeft(768, 900)).toBeCloseTo(-145.92);
        expect(aboutCircleLeft(769, 900)).toBe(-144);
    });

    it("caps the desktop Experience circle by the smaller limit", () => {
        expect(experienceCircleSize(1440, 900)).toBe(621);
        expect(experienceCircleSize(1024, 1400)).toBeCloseTo(476.16);
    });

    it("uses the mobile Experience ratio at the breakpoint", () => {
        expect(experienceCircleSize(768, 900)).toBeCloseTo(599.04);
    });

    it("caps the desktop Projects circle by the smaller limit", () => {
        expect(projectCircleSize(1440, 900)).toBeCloseTo(489.6);
        expect(projectCircleSize(1024, 1400)).toBeCloseTo(393.216);
    });

    it("uses the mobile Projects ratio at the breakpoint", () => {
        expect(projectCircleSize(768, 900)).toBeCloseTo(442.368);
    });

    it("sizes Skills and Contact from the shorter viewport edge", () => {
        expect(skillsCircleSize(1440, 900)).toBe(810);
        expect(contactCircleSize(1440, 900)).toBeCloseTo(504);
    });

    it("positions the Skills circle before the navigation rail", () => {
        expect(skillsCircleLeft(1440, 900, 1320)).toBe(870);
    });
});
