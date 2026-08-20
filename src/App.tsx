import { useState } from "react";
import { MainCircle } from "./components/MainCircle";
import { Navigation } from "./components/Navigation";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Experience } from "./sections/Experience";
import { Home } from "./sections/Home";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";

export default function App() {
    const [experienceImage, setExperienceImage] = useState("/picolove.jpg");

    return (
        <>
            <MainCircle experienceImage={experienceImage} />
            <Navigation />
            <main>
                <Home />
                <div className="section-static-container"><About /></div>
                <div className="section-static-container">
                    <Experience onActiveEventChange={setExperienceImage} />
                </div>
                <div className="section-static-container"><Projects /></div>
                <div className="section-static-container"><Skills /></div>
                <Contact />
            </main>
        </>
    );
}
