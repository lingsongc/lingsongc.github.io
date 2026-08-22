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
    const [activeProject, setActiveProject] = useState(projects[0]);

    return (
        <>
            <BackgroundGrid />
            <MainCircle experienceImage={experienceImage} activeProject={activeProject} />
            <Navigation />
            <main>
                <Home />
                <div className="section-static-container"><About /></div>
                <div className="section-static-container">
                    <Experience onActiveEventChange={setExperienceImage} />
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
