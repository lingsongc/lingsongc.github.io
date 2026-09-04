import { useCallback, useState } from "react";
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

type MainCircleImageState = {
    owner: "home" | "about" | "experience" | "projects" | null;
    image: ImageDescriptor | null;
};

export default function App() {
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

    return (
        <>
            <BackgroundGrid />
            <Navigation />
            <main>
                <MainCircle image={mainCircleImage.image} />
                <Home onMainCircleImageChange={publishHomeImage} />
                <div className="section-static-container"><About onMainCircleImageChange={publishAboutImage} /></div>
                <div id="experience" className="section-static-container">
                    <Experience onMainCircleImageChange={publishExperienceImage} />
                </div>
                <div className="section-static-container">
                    <Projects onMainCircleImageChange={publishProjectImage} />
                </div>
                <div className="section-static-container"><Skills /></div>
                <Contact />
            </main>
        </>
    );
}
