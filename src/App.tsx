import { MainCircle } from "./components/MainCircle";
import { Navigation } from "./components/Navigation";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Experience } from "./sections/Experience";
import { Home } from "./sections/Home";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";

export default function App() {
    return (
        <>
            <MainCircle />
            <Navigation />
            <main>
                <Home />
                <div id="home-about-transition" className="section-transition-spacer" aria-hidden="true" />
                <About />
                <div id="about-experience-transition" className="section-transition-spacer" aria-hidden="true" />
                <Experience />
                <div className="section-transition-spacer" aria-hidden="true" />
                <Projects />
                <div className="section-transition-spacer" aria-hidden="true" />
                <Skills />
                <div className="section-transition-spacer" aria-hidden="true" />
                <Contact />
            </main>
        </>
    );
}
