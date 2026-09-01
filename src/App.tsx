import { useState } from "react";
import { BackgroundGrid } from "./components/BackgroundGrid";
import { MainCircle } from "./components/MainCircle";
import { Navigation } from "./components/Navigation";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Experience } from "./sections/Experience";
import { Home } from "./sections/Home";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";
import { projects } from "./data/projects";

export default function App() {
    const [experienceImage, setExperienceImage] = useState("/experience/picolove.jpg");
    const [experienceOrbitHost, setExperienceOrbitHost] = useState<HTMLElement | null>(null);
    const [experienceVisible, setExperienceVisible] = useState(false);
    const [activeProject, setActiveProject] = useState(projects[0]);

    return (
        <>
            <BackgroundGrid />
            <Navigation />
            <main>
                <MainCircle
                    experienceImage={experienceImage}
                    experienceVisible={experienceVisible}
                    onExperienceOrbitHostChange={setExperienceOrbitHost}
                    activeProject={activeProject}
                />
                <Home />
                <div className="section-static-container"><About /></div>
                <div id="experience" className="section-static-container">
                    <Experience
                        orbitLayerTarget={experienceOrbitHost}
                        onActiveEventChange={setExperienceImage}
                        onVisibilityChange={setExperienceVisible}
                    />
                </div>
                <div className="section-static-container">
                    <Projects activeProjectId={activeProject.id} onProjectSelect={setActiveProject} />
                </div>
                <div className="section-static-container"><Skills /></div>
                <Contact />
            </main>
        </>
    );
}
