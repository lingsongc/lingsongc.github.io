import type {
    MainCircleEndpoint,
    MainCircleSceneEndpointResolvers,
    MainCircleSceneEndpoints,
} from "../types/mainCircle";
import { sceneOrder } from "../types/scene";
import {
    aboutCircleLeft,
    aboutCircleSize,
    contactCircleSize,
    experienceCircleSize,
    projectCircleSize,
    skillsCircleLeft,
    skillsCircleSize,
} from "./mainCircleGeometry";

export type MainCircleSceneLayout = {
    viewportWidth: number;
    viewportHeight: number;
    homeCircleWidth: number;
    experienceCenter: {
        top: number;
        left: number;
    };
    navigationRailLeft: number;
};

// Defines every scene endpoint without document positions or target elements.
export const mainCircleSceneEndpointResolvers = {
    home: ({ viewportWidth, viewportHeight, homeCircleWidth }) => ({
        width: homeCircleWidth,
        top: viewportHeight / 2,
        left: viewportWidth / 2,
    }),
    about: ({ viewportWidth, viewportHeight }) => ({
        width: aboutCircleSize(viewportWidth, viewportHeight),
        top: viewportHeight / 2,
        left: aboutCircleLeft(viewportWidth, viewportHeight),
    }),
    experience: ({ viewportWidth, viewportHeight, experienceCenter }) => ({
        width: experienceCircleSize(viewportWidth, viewportHeight),
        top: experienceCenter.top,
        left: experienceCenter.left,
    }),
    projects: ({ viewportWidth, viewportHeight }) => ({
        width: projectCircleSize(viewportWidth, viewportHeight),
        top: viewportHeight / 2,
        left: viewportWidth / 2,
    }),
    skills: ({ viewportWidth, viewportHeight, navigationRailLeft }) => ({
        width: skillsCircleSize(viewportWidth, viewportHeight),
        top: viewportHeight / 2,
        left: skillsCircleLeft(viewportWidth, viewportHeight, navigationRailLeft),
    }),
    contact: ({ viewportWidth, viewportHeight }) => ({
        width: contactCircleSize(viewportWidth, viewportHeight),
        top: viewportHeight / 2,
        left: viewportWidth / 2,
    }),
} satisfies MainCircleSceneEndpointResolvers<MainCircleSceneLayout>;

// Resolves a complete endpoint record from one current layout snapshot.
export function resolveMainCircleSceneEndpoints(
    layout: MainCircleSceneLayout,
): MainCircleSceneEndpoints {
    return Object.fromEntries(sceneOrder.map((sceneId) => [
        sceneId,
        mainCircleSceneEndpointResolvers[sceneId](layout),
    ])) as MainCircleSceneEndpoints;
}

// Resolves one endpoint when a transition needs only its requested scene.
export function resolveMainCircleSceneEndpoint(
    sceneId: keyof MainCircleSceneEndpoints,
    layout: MainCircleSceneLayout,
): MainCircleEndpoint {
    return mainCircleSceneEndpointResolvers[sceneId](layout);
}
