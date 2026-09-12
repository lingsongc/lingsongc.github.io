import { useCallback, useEffect, useRef, useState } from "react";
import { MAIN_CIRCLE_TRAVEL_DURATION_MS } from "../components/main-circle/mainCircleGeometry";
import { sceneOrder, type SceneDirection, type SceneId, type SceneLifecycleControl, type SceneRequest, type SceneRequestResult } from "../types/scene";

const SCENE_VISUAL_DURATION_MS = 500;

export type SceneTransitionState =
    | { currentSceneId: SceneId; direction: null; phase: "idle"; requestedSceneId: null }
    | { currentSceneId: SceneId; direction: SceneDirection; phase: "closing" | "moving" | "opening"; requestedSceneId: SceneId };
type CoordinatorState = SceneTransitionState & { settledVersion: number; travelProgress: number };

// Owns slideshow state, phase timing, URL behavior, recovery, and reduced motion.
export function useSlideshowCoordinator() {
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const [state, setState] = useState<CoordinatorState>(() => ({ ...createSceneTransitionState(initialSceneIdFromHash(window.location.hash)), settledVersion: 0, travelProgress: 0 }));
    const stateRef = useRef(state);
    const reducedMotionRef = useRef(reducedMotion);
    const lastHandledHashRef = useRef(window.location.hash);
    const lastSettledVersionRef = useRef(state.settledVersion);
    const phaseFrameRef = useRef(0);
    const travelFrameRef = useRef(0);

    const commit = useCallback((next: CoordinatorState) => { stateRef.current = next; setState(next); }, []);
    const settleRequestedScene = useCallback(() => {
        const current = stateRef.current;
        if (current.phase === "idle") return false;
        cancelAnimationFrame(phaseFrameRef.current);
        cancelAnimationFrame(travelFrameRef.current);
        commit({ ...createSceneTransitionState(current.requestedSceneId), settledVersion: current.settledVersion + 1, travelProgress: 0 });
        return true;
    }, [commit]);

    const requestScene = useCallback((request: SceneRequest): SceneRequestResult => {
        const current = stateRef.current;
        const update = requestSceneTransition(current, request);
        if (update.result.status !== "accepted") return update.result;
        commit(reducedMotionRef.current
            ? { ...createSceneTransitionState(update.result.destinationSceneId), settledVersion: current.settledVersion + 1, travelProgress: 0 }
            : { ...update.state, settledVersion: current.settledVersion, travelProgress: 0 });
        return update.result;
    }, [commit]);

    useEffect(() => {
        cancelAnimationFrame(phaseFrameRef.current);
        cancelAnimationFrame(travelFrameRef.current);
        if (state.phase === "closing" || state.phase === "opening") {
            const visualPhase = state.phase;
            const startedAt = performance.now();
            // A paint-aligned clock keeps the CSS transition active without updating React on every frame.
            const tick = (now: number) => {
                const current = stateRef.current;
                if (current.phase !== visualPhase) return;
                if (now - startedAt >= SCENE_VISUAL_DURATION_MS) {
                    commit(visualPhase === "closing"
                        ? { ...advanceSceneTransition(current), settledVersion: current.settledVersion, travelProgress: 0 }
                        : { ...createSceneTransitionState(current.requestedSceneId), settledVersion: current.settledVersion, travelProgress: 0 });
                    return;
                }
                phaseFrameRef.current = requestAnimationFrame(tick);
            };
            phaseFrameRef.current = requestAnimationFrame(tick);
        } else if (state.phase === "moving") {
            const startedAt = performance.now();
            const tick = (now: number) => {
                const current = stateRef.current;
                if (current.phase !== "moving") return;
                const progress = clamp((now - startedAt) / MAIN_CIRCLE_TRAVEL_DURATION_MS, 0, 1);
                if (progress >= 1) {
                    commit({ ...advanceSceneTransition(current), settledVersion: current.settledVersion, travelProgress: 1 });
                    return;
                }
                commit({ ...current, travelProgress: progress });
                travelFrameRef.current = requestAnimationFrame(tick);
            };
            travelFrameRef.current = requestAnimationFrame(tick);
        }
        return () => { cancelAnimationFrame(phaseFrameRef.current); cancelAnimationFrame(travelFrameRef.current); };
    }, [commit, state.phase]);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => {
            reducedMotionRef.current = mediaQuery.matches;
            setReducedMotion(mediaQuery.matches);
            if (mediaQuery.matches) settleRequestedScene();
        };
        mediaQuery.addEventListener("change", updatePreference);
        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, [settleRequestedScene]);

    useEffect(() => {
        if (!window.location.hash || sceneIdFromHash(window.location.hash)) return;
        lastHandledHashRef.current = "#home";
        window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
    }, []);

    useEffect(() => {
        const arrivedDuringOpening = state.phase === "opening" && state.requestedSceneId === state.currentSceneId;
        const arrivedImmediately = state.settledVersion !== lastSettledVersionRef.current;
        if (!arrivedDuringOpening && !arrivedImmediately) return;
        lastSettledVersionRef.current = state.settledVersion;
        if (sceneIdFromHash(window.location.hash) === state.currentSceneId) return;
        lastHandledHashRef.current = `#${state.currentSceneId}`;
        window.history.pushState({ sceneId: state.currentSceneId }, "", sceneUrl(state.currentSceneId, window.location));
    }, [state.currentSceneId, state.phase, state.requestedSceneId, state.settledVersion]);

    useEffect(() => {
        const recover = () => { settleRequestedScene(); };
        const hide = () => { if (document.hidden) settleRequestedScene(); };
        window.addEventListener("resize", recover);
        window.addEventListener("orientationchange", recover);
        document.addEventListener("visibilitychange", hide);
        return () => {
            window.removeEventListener("resize", recover);
            window.removeEventListener("orientationchange", recover);
            document.removeEventListener("visibilitychange", hide);
        };
    }, [settleRequestedScene]);

    useEffect(() => {
        const requestLocationScene = () => {
            const hash = window.location.hash;
            if (hash === lastHandledHashRef.current) return;
            lastHandledHashRef.current = hash;
            const destinationSceneId = sceneIdFromHash(hash);
            if (!destinationSceneId) {
                lastHandledHashRef.current = "#home";
                window.history.replaceState({ sceneId: "home" }, "", sceneUrl("home", window.location));
            }
            requestScene({ kind: "direct", destinationSceneId: destinationSceneId ?? "home", source: "history" });
        };
        window.addEventListener("popstate", requestLocationScene);
        window.addEventListener("hashchange", requestLocationScene);
        return () => { window.removeEventListener("popstate", requestLocationScene); window.removeEventListener("hashchange", requestLocationScene); };
    }, [requestScene]);

    const lifecycleFor = useCallback((sceneId: SceneId): SceneLifecycleControl => ({
        active: state.phase !== "moving" && state.currentSceneId === sceneId,
        phase: state.phase,
        reducedMotion,
    }), [reducedMotion, state.currentSceneId, state.phase]);

    return { ...state, activeSceneId: state.phase === "moving" ? null : state.currentSceneId, busy: state.phase !== "idle", lifecycleFor, reducedMotion, requestScene };
}

export function createSceneTransitionState(currentSceneId: SceneId): SceneTransitionState {
    return { currentSceneId, direction: null, phase: "idle", requestedSceneId: null };
}

// Evaluates one request without queuing input while the coordinator is busy.
export function requestSceneTransition(state: SceneTransitionState, request: SceneRequest) {
    if (state.phase !== "idle") return { result: { status: "ignored", reason: "busy" } as const, state };
    const currentIndex = sceneOrder.indexOf(state.currentSceneId);
    const destinationSceneId = request.kind === "direct" ? request.destinationSceneId : sceneOrder[currentIndex + (request.direction === "forward" ? 1 : -1)] ?? null;
    if (!destinationSceneId) return { result: { status: "rejected", reason: "boundary" } as const, state };
    if (destinationSceneId === state.currentSceneId) return { result: { status: "ignored", reason: "same-scene" } as const, state };
    const direction = sceneOrder.indexOf(destinationSceneId) > currentIndex ? "forward" as const : "backward" as const;
    const result = { status: "accepted" as const, destinationSceneId, direction };
    return { result, state: { currentSceneId: state.currentSceneId, direction, phase: "closing" as const, requestedSceneId: destinationSceneId } };
}

export function advanceSceneTransition(state: SceneTransitionState): SceneTransitionState {
    if (state.phase === "closing") return { ...state, phase: "moving" };
    if (state.phase === "moving") return { ...state, currentSceneId: state.requestedSceneId, phase: "opening" };
    if (state.phase === "opening") return createSceneTransitionState(state.requestedSceneId);
    return state;
}

export function sceneIdFromHash(hash: string): SceneId | null { const candidate = hash.replace(/^#/, ""); return sceneOrder.find((sceneId) => sceneId === candidate) ?? null; }
export function initialSceneIdFromHash(hash: string): SceneId { return sceneIdFromHash(hash) ?? "home"; }
export function sceneUrl(sceneId: SceneId, location: Pick<Location, "pathname" | "search">) { return `${location.pathname}${location.search}#${sceneId}`; }
function clamp(value: number, minimum: number, maximum: number) { return Math.min(Math.max(value, minimum), maximum); }
