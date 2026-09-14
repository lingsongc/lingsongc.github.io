import { useCallback, useEffect, useRef } from "react";
import { BackgroundGrid, type BackgroundGridHandle } from "./components/background-grid/BackgroundGrid";
import { MainCircle } from "./components/main-circle/MainCircle";
import { useMainCircle } from "./components/main-circle/useMainCircle";
import { Navigation } from "./components/navigation/Navigation";
import { ScenePanel } from "./components/scene-panel/ScenePanel";
import { homeCircleSize, resolveMainCircleSceneEndpoint } from "./components/main-circle/mainCircleGeometry";
import { useSlideshowCoordinator } from "./motion/useSlideshowCoordinator";
import { useSceneInput } from "./motion/useSceneInput";
import { About } from "./sections/about/About";
import { Contact } from "./sections/contact/Contact";
import { Experience } from "./sections/experience/Experience";
import { Home } from "./sections/home/Home";
import { Projects } from "./sections/projects/Projects";
import { Skills } from "./sections/skills/Skills";
import type { MainCircleImagePublisher } from "./types/images";
import type { SceneId, ScenePhase } from "./types/scene";

// Maps each coordinator-owned scene to its Section-owned focus destination.
const sceneHeadingIds: Record<SceneId, string> = {
    home: "home-title",
    about: "about-title",
    experience: "experience-title",
    projects: "project-title",
    skills: "skill-title",
    contact: "contact-title",
};

// Composes the six viewport Sections around one page-level slideshow coordinator.
export default function App() {
    const activeSceneScrollerRef = useRef<HTMLDivElement>(null);
    const backgroundGridRef = useRef<BackgroundGridHandle>(null);
    const experienceOrbitRef = useRef<HTMLElement>(null);
    const navigationRailRef = useRef<HTMLDivElement>(null);
    const slideshow = useSlideshowCoordinator();
    const previousScenePhaseRef = useRef<ScenePhase | null>(null);
    const previousSettledVersionRef = useRef(slideshow.settledVersion);
    // Keeps reduced-motion input still while forwarding ordinary wheel intent to the grid owner.
    const updateWheelFeedback = useCallback((progress: number, durationMs: number) => {
        backgroundGridRef.current?.setScrollFeedback(
            slideshow.reducedMotion ? 0 : progress,
            slideshow.reducedMotion ? 0 : durationMs,
        );
    }, [slideshow.reducedMotion]);
    // Removes any active deformation immediately when reduced motion becomes preferred.
    useEffect(() => {
        if (slideshow.reducedMotion) backgroundGridRef.current?.setScrollFeedback(0, 0);
    }, [slideshow.reducedMotion]);
    const sceneInput = useSceneInput({
        activeScrollerRef: activeSceneScrollerRef,
        currentSceneId: slideshow.currentSceneId,
        onWheelFeedbackChange: updateWheelFeedback,
        phase: slideshow.phase,
        requestScene: slideshow.requestScene,
    });
    // Measures the current viewport-owned inputs needed by a requested endpoint.
    const resolveCircleEndpoint = useCallback((sceneId: SceneId) => {
        const experienceBounds = experienceOrbitRef.current?.getBoundingClientRect();
        const navigationBounds = navigationRailRef.current?.getBoundingClientRect();
        const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
        return resolveMainCircleSceneEndpoint(sceneId, {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            homeCircleWidth: homeCircleSize(window.innerWidth, rootFontSize),
            experienceCenter: experienceBounds
                ? {
                    top: experienceBounds.top + experienceBounds.height / 2,
                    left: experienceBounds.left + experienceBounds.width / 2,
                }
                : { top: window.innerHeight * 0.64, left: window.innerWidth / 2 },
            navigationRailLeft: navigationBounds?.left ?? window.innerWidth,
        });
    }, []);

    const mainCircle = useMainCircle({
        currentSceneId: slideshow.currentSceneId,
        requestedSceneId: slideshow.requestedSceneId,
        phase: slideshow.phase,
        travelProgress: slideshow.travelProgress,
        layoutVersion: slideshow.settledVersion,
        resolveEndpoint: resolveCircleEndpoint,
    });

    // Gives each Section a stable descriptor publisher without exposing the registry.
    const publishHomeImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircle.publishSceneImage("home", image),
        [mainCircle.publishSceneImage],
    );
    const publishAboutImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircle.publishSceneImage("about", image),
        [mainCircle.publishSceneImage],
    );
    const publishExperienceImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircle.publishSceneImage("experience", image),
        [mainCircle.publishSceneImage],
    );
    const publishProjectImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircle.publishSceneImage("projects", image),
        [mainCircle.publishSceneImage],
    );

    // Converts a named control activation into one direct, non-queued request.
    const requestScene = useCallback((sceneId: SceneId) => {
        sceneInput.cancelPendingInput();
        slideshow.requestScene({
            kind: "direct",
            destinationSceneId: sceneId,
            source: "navigation",
        });
    }, [slideshow.requestScene, sceneInput.cancelPendingInput]);

    useEffect(() => {
        const previousPhase = previousScenePhaseRef.current;
        const settledImmediately = slideshow.settledVersion !== previousSettledVersionRef.current;
        if ((previousPhase === "opening" && slideshow.phase === "idle") || settledImmediately) {
            const focusedElement = document.activeElement;
            if (!isExplicitControl(focusedElement)) {
                const heading = document.getElementById(sceneHeadingIds[slideshow.currentSceneId]);
                heading?.focus({ preventScroll: true });
            }
        }
        previousScenePhaseRef.current = slideshow.phase;
        previousSettledVersionRef.current = slideshow.settledVersion;
    }, [slideshow.currentSceneId, slideshow.phase, slideshow.settledVersion]);

    return (
        <>
            <BackgroundGrid ref={backgroundGridRef} circleGeometry={mainCircle.geometry} />

            <Navigation
                railRef={navigationRailRef}
                sceneControl={{
                    busy: slideshow.busy,
                    currentSceneId: slideshow.currentSceneId,
                    destinationSceneId: slideshow.requestedSceneId,
                    onSceneRequest: requestScene,
                    phase: slideshow.phase,
                    travelProgress: mainCircle.easedTravelProgress,
                }}
            />

            <main className="slideshow-stage">
                <MainCircle
                    geometry={mainCircle.geometry}
                    image={mainCircle.image}
                    imageVisible={mainCircle.imageVisible}
                />

                <ScenePanel
                    active={slideshow.activeSceneId === "home"}
                    headingFocusTargetId="home-title"
                    overflowRef={activeSceneScrollerRef}
                >
                    <Home
                        lifecycle={slideshow.lifecycleFor("home")}
                        onMainCircleImageChange={publishHomeImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "about"}
                    headingFocusTargetId="about-title"
                    overflowRef={activeSceneScrollerRef}
                >
                    <About
                        lifecycle={slideshow.lifecycleFor("about")}
                        onMainCircleImageChange={publishAboutImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "experience"}
                    headingFocusTargetId="experience-title"
                    overflowRef={activeSceneScrollerRef}
                    scrollable={false}
                >
                    <Experience
                        lifecycle={slideshow.lifecycleFor("experience")}
                        orbitRef={experienceOrbitRef}
                        onMainCircleImageChange={publishExperienceImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "projects"}
                    headingFocusTargetId="project-title"
                    overflowRef={activeSceneScrollerRef}
                    scrollable={false}
                >
                    <Projects
                        lifecycle={slideshow.lifecycleFor("projects")}
                        onMainCircleImageChange={publishProjectImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "skills"}
                    headingFocusTargetId="skill-title"
                    overflowRef={activeSceneScrollerRef}
                >
                    <Skills lifecycle={slideshow.lifecycleFor("skills")} />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "contact"}
                    headingFocusTargetId="contact-title"
                    overflowRef={activeSceneScrollerRef}
                >
                    <Contact lifecycle={slideshow.lifecycleFor("contact")} />
                </ScenePanel>
            </main>
        </>
    );
}

// Leaves an intentionally active link, button, or form field in place after its scene opens.
function isExplicitControl(element: Element | null) {
    return element?.matches(
        "a, button, input, textarea, select, option, [contenteditable]:not([contenteditable='false']), [role='button'], [role='slider'], [role='listbox']",
    ) ?? false;
}
