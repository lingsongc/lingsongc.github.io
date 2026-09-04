import { useCallback, useMemo, useRef, useState } from "react";
import { BackgroundGrid } from "./components/BackgroundGrid";
import { MainCircle } from "./components/MainCircle";
import { Navigation } from "./components/Navigation";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Experience } from "./sections/Experience";
import { Home } from "./sections/Home";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";
import type { ImageDescriptor } from "./types/images";
import type { MainCircleTransition } from "./types/mainCircle";

type MainCircleImageState = {
    owner: "home" | "about" | "experience" | "projects" | null;
    image: ImageDescriptor | null;
};

export default function App() {
    const mainCircleRef = useRef<HTMLDivElement>(null);
    const aboutSectionRef = useRef<HTMLElement>(null);
    const experienceSectionRef = useRef<HTMLDivElement>(null);
    const experienceOrbitRef = useRef<HTMLElement>(null);
    const projectsSectionRef = useRef<HTMLElement>(null);
    const skillsSectionRef = useRef<HTMLElement>(null);
    const contactSectionRef = useRef<HTMLElement>(null);
    const navigationRailRef = useRef<HTMLDivElement>(null);
    const [mainCircleImage, setMainCircleImage] = useState<MainCircleImageState>({ owner: null, image: null });
    const publishMainCircleImage = useCallback((owner: Exclude<MainCircleImageState["owner"], null>, image: ImageDescriptor | null) => {
        setMainCircleImage((current) => {
            if (image) return { owner, image };
            return current.owner === owner ? { owner: null, image: null } : current;
        });
    }, []);
    const publishHomeImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("home", image), [publishMainCircleImage]);
    const publishAboutImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("about", image), [publishMainCircleImage]);
    const publishExperienceImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("experience", image), [publishMainCircleImage]);
    const publishProjectImage = useCallback((image: ImageDescriptor | null) => publishMainCircleImage("projects", image), [publishMainCircleImage]);
    const mainCircleTransitions = useMemo<readonly MainCircleTransition[]>(() => {
        const aboutCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.95
            : window.innerHeight * 1.6;
        const experienceCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.78
            : Math.min(window.innerWidth * 0.465, window.innerHeight * 0.69);
        const projectCircleSize = () => window.innerWidth <= 768
            ? window.innerWidth * 0.576
            : Math.min(window.innerWidth * 0.384, window.innerHeight * 0.544);
        const skillsCircleSize = () => Math.min(window.innerWidth, window.innerHeight) * 0.9;

        return [
            {
                target: aboutSectionRef,
                geometry: {
                    width: aboutCircleSize,
                    left: () => aboutCircleSize() * (window.innerWidth <= 768 ? -0.2 : -0.1),
                },
            },
            {
                target: experienceSectionRef,
                geometry: {
                    width: experienceCircleSize,
                    top: () => experienceOrbitRef.current?.offsetTop ?? window.innerHeight / 2,
                    left: () => experienceOrbitRef.current?.offsetLeft ?? window.innerWidth / 2,
                },
            },
            {
                target: projectsSectionRef,
                geometry: { width: projectCircleSize, top: "50%", left: "50%" },
            },
            {
                target: skillsSectionRef,
                geometry: {
                    width: skillsCircleSize,
                    top: "50%",
                    left: () => {
                        const circleSize = skillsCircleSize();
                        const circleGap = (window.innerHeight - circleSize) / 2;
                        const railLeft = navigationRailRef.current?.getBoundingClientRect().left ?? window.innerWidth;
                        return railLeft - circleGap - circleSize / 2;
                    },
                },
            },
            {
                target: contactSectionRef,
                geometry: {
                    width: () => Math.min(window.innerWidth, window.innerHeight) * 0.56,
                    top: "50%",
                    left: "50%",
                },
            },
        ];
    }, []);

    return (
        <>
            <BackgroundGrid warpTargetRef={mainCircleRef} />
            <Navigation railRef={navigationRailRef} />
            <main>
                <MainCircle circleRef={mainCircleRef} image={mainCircleImage.image} transitions={mainCircleTransitions} />
                <Home onMainCircleImageChange={publishHomeImage} />
                <div className="section-static-container">
                    <About sectionRef={aboutSectionRef} onMainCircleImageChange={publishAboutImage} />
                </div>
                <div ref={experienceSectionRef} id="experience" className="section-static-container">
                    <Experience orbitRef={experienceOrbitRef} onMainCircleImageChange={publishExperienceImage} />
                </div>
                <div className="section-static-container">
                    <Projects sectionRef={projectsSectionRef} onMainCircleImageChange={publishProjectImage} />
                </div>
                <div className="section-static-container"><Skills sectionRef={skillsSectionRef} /></div>
                <Contact sectionRef={contactSectionRef} />
            </main>
        </>
    );
}
