import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackgroundGrid } from "./components/background-grid/BackgroundGrid";
import { MainCircle } from "./components/main-circle/MainCircle";
import { Navigation } from "./components/navigation/Navigation";
import { ScenePanel } from "./components/scene-panel/ScenePanel";
import { homeCircleSize } from "./motion/mainCircleGeometry";
import { resolveMainCircleSceneEndpoint } from "./motion/mainCircleSceneEndpoints";
import { useMainCircleImageLifecycle } from "./motion/useMainCircleImageLifecycle";
import { initialSceneIdFromHash } from "./motion/sceneHistory";
import { useSlideshowCoordinator } from "./motion/useSlideshowCoordinator";
import { useSceneInput } from "./motion/useSceneInput";
import { sceneCompositionOffset } from "./motion/sceneInputIntent";
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
    const mainCircleRef = useRef<HTMLDivElement>(null);
    const activeSceneScrollerRef = useRef<HTMLDivElement>(null);
    const homeSectionRef = useRef<HTMLElement>(null);
    const aboutFallbackRef = useRef<HTMLDivElement>(null);
    const experienceFallbackRef = useRef<HTMLDivElement>(null);
    const experienceOrbitRef = useRef<HTMLElement>(null);
    const projectsFallbackRef = useRef<HTMLDivElement>(null);
    const skillsFallbackRef = useRef<HTMLDivElement>(null);
    const contactSectionRef = useRef<HTMLElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const navigationCopyrightRef = useRef<HTMLElement>(null);
    const navigationRailRef = useRef<HTMLDivElement>(null);
    const [easedTravelProgress, setEasedTravelProgress] = useState(0);
    const initialSceneIdRef = useRef(initialSceneIdFromHash(window.location.hash));
    const slideshow = useSlideshowCoordinator(initialSceneIdRef.current);
    const previousScenePhaseRef = useRef<ScenePhase | null>(null);
    const sceneInput = useSceneInput({
        activeScrollerRef: activeSceneScrollerRef,
        currentSceneId: slideshow.currentSceneId,
        phase: slideshow.phase,
        requestScene: slideshow.requestScene,
    });
    const mainCircleImage = useMainCircleImageLifecycle({
        currentSceneId: slideshow.currentSceneId,
        phase: slideshow.phase,
        requestedSceneId: slideshow.requestedSceneId,
    });

    useLayoutEffect(() => {
        // Portalled Section layers read the same page-owned pull as the viewport stage.
        document.documentElement.style.setProperty(
            "--slideshow-resistance-offset",
            `${sceneCompositionOffset(sceneInput.resistanceProgress)}px`,
        );
    }, [sceneInput.resistanceProgress]);

    useEffect(() => () => {
        document.documentElement.style.removeProperty("--slideshow-resistance-offset");
    }, []);

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

    // Gives each Section a stable descriptor publisher without exposing the registry.
    const publishHomeImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircleImage.publishSceneImage("home", image),
        [mainCircleImage.publishSceneImage],
    );
    const publishAboutImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircleImage.publishSceneImage("about", image),
        [mainCircleImage.publishSceneImage],
    );
    const publishExperienceImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircleImage.publishSceneImage("experience", image),
        [mainCircleImage.publishSceneImage],
    );
    const publishProjectImage = useCallback<MainCircleImagePublisher>(
        (image) => mainCircleImage.publishSceneImage("projects", image),
        [mainCircleImage.publishSceneImage],
    );

    // Converts a named control activation into one direct, non-queued request.
    const requestScene = useCallback((sceneId: SceneId) => {
        sceneInput.cancelResistance();
        slideshow.requestScene({
            kind: "direct",
            destinationSceneId: sceneId,
            source: "navigation",
        });
    }, [slideshow.requestScene, sceneInput.cancelResistance]);

    useEffect(() => {
        const previousPhase = previousScenePhaseRef.current;
        if (previousPhase === "opening" && slideshow.phase === "idle") {
            const focusedElement = document.activeElement;
            if (!isExplicitControl(focusedElement)) {
                const heading = document.getElementById(sceneHeadingIds[slideshow.currentSceneId]);
                heading?.focus({ preventScroll: true });
            }
        }
        previousScenePhaseRef.current = slideshow.phase;
    }, [slideshow.currentSceneId, slideshow.phase]);

    return (
        <>
            <BackgroundGrid
                resistanceProgress={sceneInput.resistanceProgress}
                warpTargetRef={mainCircleRef}
            />

            <Navigation
                copyrightRef={navigationCopyrightRef}
                navigationRef={navigationRef}
                railRef={navigationRailRef}
                sceneControl={{
                    busy: slideshow.busy,
                    currentSceneId: slideshow.currentSceneId,
                    destinationSceneId: slideshow.requestedSceneId,
                    onSceneRequest: requestScene,
                    phase: slideshow.phase,
                    travelProgress: easedTravelProgress,
                }}
            />

            <main className="slideshow-stage">
                <MainCircle
                    circleRef={mainCircleRef}
                    directTransition={{
                        currentSceneId: slideshow.currentSceneId,
                        requestedSceneId: slideshow.requestedSceneId,
                        phase: slideshow.phase,
                        travelProgress: slideshow.travelProgress,
                        resolveEndpoint: resolveCircleEndpoint,
                        onTravelProgress: setEasedTravelProgress,
                    }}
                    image={mainCircleImage.image}
                    imageVisible={mainCircleImage.imageVisible}
                    navigationTargetId={null}
                />

                <ScenePanel
                    active={slideshow.activeSceneId === "home"}
                    headingFocusTargetId="home-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="home"
                >
                    <Home
                        lifecycle={slideshow.lifecycleFor("home")}
                        sectionRef={homeSectionRef}
                        onMainCircleImageChange={publishHomeImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "about"}
                    headingFocusTargetId="about-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="about"
                >
                    <About
                        lifecycle={slideshow.lifecycleFor("about")}
                        restingContainerRef={aboutFallbackRef}
                        onMainCircleImageChange={publishAboutImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "experience"}
                    headingFocusTargetId="experience-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="experience"
                >
                    <Experience
                        lifecycle={slideshow.lifecycleFor("experience")}
                        restingContainerRef={experienceFallbackRef}
                        orbitRef={experienceOrbitRef}
                        onMainCircleImageChange={publishExperienceImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "projects"}
                    headingFocusTargetId="project-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="projects"
                >
                    <Projects
                        lifecycle={slideshow.lifecycleFor("projects")}
                        restingContainerRef={projectsFallbackRef}
                        onMainCircleImageChange={publishProjectImage}
                    />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "skills"}
                    headingFocusTargetId="skill-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="skills"
                >
                    <Skills lifecycle={slideshow.lifecycleFor("skills")} />
                </ScenePanel>

                <ScenePanel
                    active={slideshow.activeSceneId === "contact"}
                    headingFocusTargetId="contact-title"
                    overflowRef={activeSceneScrollerRef}
                    phase={slideshow.phase}
                    sceneId="contact"
                >
                    <Contact
                        lifecycle={slideshow.lifecycleFor("contact")}
                        sectionRef={contactSectionRef}
                    />
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
