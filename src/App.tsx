import { MainCircle } from "./components/MainCircle";
import { Navigation } from "./components/Navigation";
import { useScrollScene } from "./motion/useScrollScene";
import { About } from "./sections/About";
import { Contact } from "./sections/Contact";
import { Experience } from "./sections/Experience";
import { Home } from "./sections/Home";
import { Projects } from "./sections/Projects";
import { Skills } from "./sections/Skills";

export default function App() {
    useScrollScene();

    return (
        <>
            <MainCircle />
            <Navigation />
            <main>
                <Home />
                <About />
                <Experience />
                <Projects />
                <Skills />
                <Contact />
            </main>
        </>
    );
}
