import { useCallback, useMemo, useRef, useState } from "react";
import { BackgroundGrid } from "./components/background-grid/BackgroundGrid";
import { MainCircle } from "./components/main-circle/MainCircle";
import { Navigation } from "./components/navigation/Navigation";
import { SectionRestingContainer } from "./components/section-resting-container/SectionRestingContainer";
import { About } from "./sections/about/About";
import { Contact } from "./sections/contact/Contact";
import { Experience } from "./sections/experience/Experience";
import { Home } from "./sections/home/Home";
import { Projects } from "./sections/projects/Projects";
import { Skills } from "./sections/skills/Skills";
import {
    aboutCircleSize,
    contactCircleSize,
    experienceCircleSize,
    projectCircleSize,
    skillsCircleLeft,
    skillsCircleSize,
} from "./motion/mainCircleGeometry";
import { useNavigationTransition } from "./motion/useNavigationTransition";
import type { ImageDescriptor } from "./types/images";
import type { MainCircleTransition } from "./types/mainCircle";

type MainCircleImageState = {
    owner: "home" | "about" | "experience" | "projects" | null;
    image: ImageDescriptor | null;
};

// Composes the portfolio sections and coordinates the persistent main circle.
export default function App() {
    const mainCircleRef = useRef<HTMLDivElement>(null);
    const homeSectionRef = useRef<HTMLElement>(null);
    const aboutRestingContainerRef = useRef<HTMLDivElement>(null);
    const experienceRestingContainerRef = useRef<HTMLDivElement>(null);
    const experienceOrbitRef = useRef<HTMLElement>(null);
    const projectsRestingContainerRef = useRef<HTMLDivElement>(null);
    const skillsRestingContainerRef = useRef<HTMLDivElement>(null);
    const contactSectionRef = useRef<HTMLElement>(null);
    const navigationRef = useRef<HTMLElement>(null);
    const navigationCopyrightRef = useRef<HTMLElement>(null);
    const navigationRailRef = useRef<HTMLDivElement>(null);
    const [mainCircleImage, setMainCircleImage] = useState<MainCircleImageState>({ owner: null, image: null });
    
    // Prevents one section from clearing an image supplied by another section.
    const publishMainCircleImage = useCallback((owner: Exclude<MainCircleImageState["owner"], null>, image: ImageDescriptor | null) => {
        setMainCircleImage((current) => {
            if (image) return { owner, image };
            return current.owner === owner ? { owner: null, image: null } : current;
        });
    }, []);
    
    // Gives each section a simple publisher without exposing the shared owner state.
    const publishHomeImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("home", image), [publishMainCircleImage]);
    const publishAboutImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("about", image), [publishMainCircleImage]);
    const publishExperienceImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("experience", image), [publishMainCircleImage]);
    const publishProjectImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("projects", image), [publishMainCircleImage]);
    
    // Maps each resting section to the circle geometry it should receive.
    const mainCircleTransitions = useMemo<readonly MainCircleTransition[]>(() => {
        return [
            {
                target: aboutRestingContainerRef,
                geometry: {
                    width: () => aboutCircleSize(window.innerWidth, window.innerHeight),
                    left: () => aboutCircleSize(window.innerWidth, window.innerHeight) * (window.innerWidth <= 768 ? -0.2 : -0.1),
                },
            },
            {
                target: experienceRestingContainerRef,
                geometry: {
                    width: () => experienceCircleSize(window.innerWidth, window.innerHeight),
                    top: () => experienceOrbitRef.current?.offsetTop ?? window.innerHeight / 2,
                    left: () => experienceOrbitRef.current?.offsetLeft ?? window.innerWidth / 2,
                },
            },
            {
                target: projectsRestingContainerRef,
                geometry: {
                    width: () => projectCircleSize(window.innerWidth, window.innerHeight),
                    top: "50%",
                    left: "50%",
                },
            },
            {
                target: skillsRestingContainerRef,
                geometry: {
                    width: () => skillsCircleSize(window.innerWidth, window.innerHeight),
                    top: "50%",
                    left: () => {
                        const railLeft = navigationRailRef.current?.getBoundingClientRect().left ?? window.innerWidth;
                        return skillsCircleLeft(window.innerWidth, window.innerHeight, railLeft);
                    },
                },
            },
            {
                target: contactSectionRef,
                geometry: {
                    width: () => contactCircleSize(window.innerWidth, window.innerHeight),
                    top: "50%",
                    left: "50%",
                },
            },
        ];
    }, []);

    useNavigationTransition({
        navigationRef,
        copyrightRef: navigationCopyrightRef,
        homeRef: homeSectionRef,
    });

    return (
        <>
            <BackgroundGrid warpTargetRef={mainCircleRef} />

            <Navigation
                copyrightRef={navigationCopyrightRef}
                navigationRef={navigationRef}
                railRef={navigationRailRef}
            />

            <main>
                <MainCircle circleRef={mainCircleRef} image={mainCircleImage.image} transitions={mainCircleTransitions} />
                
                <Home sectionRef={homeSectionRef} onMainCircleImageChange={publishHomeImage} />
                
                <SectionRestingContainer containerRef={aboutRestingContainerRef} id="about">
                    <About
                        restingContainerRef={aboutRestingContainerRef}
                        onMainCircleImageChange={publishAboutImage}
                    />
                </SectionRestingContainer>
                
                <SectionRestingContainer containerRef={experienceRestingContainerRef} id="experience">
                    <Experience
                        restingContainerRef={experienceRestingContainerRef}
                        orbitRef={experienceOrbitRef}
                        onMainCircleImageChange={publishExperienceImage}
                    />
                </SectionRestingContainer>
                
                <SectionRestingContainer containerRef={projectsRestingContainerRef} id="projects">
                    <Projects
                        restingContainerRef={projectsRestingContainerRef}
                        onMainCircleImageChange={publishProjectImage}
                    />
                </SectionRestingContainer>
                
                <SectionRestingContainer containerRef={skillsRestingContainerRef} id="skills">
                    <Skills restingContainerRef={skillsRestingContainerRef} />
                </SectionRestingContainer>
                
                <Contact sectionRef={contactSectionRef} />
            </main>
        </>
    );
}
