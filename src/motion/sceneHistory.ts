import { sceneOrder, type SceneId } from "../types/scene";

// Parses one location hash into a known slideshow scene without exposing document positions.
export function sceneIdFromHash(hash: string): SceneId | null {
    const candidate = hash.replace(/^#/, "");
    return sceneOrder.find((sceneId) => sceneId === candidate) ?? null;
}

// Resolves malformed or absent location state to the safe initial slideshow scene.
export function initialSceneIdFromHash(hash: string): SceneId {
    return sceneIdFromHash(hash) ?? "home";
}

// Preserves the current route and query while writing one named scene hash.
export function sceneUrl(sceneId: SceneId, location: Pick<Location, "pathname" | "search">) {
    return `${location.pathname}${location.search}#${sceneId}`;
}
