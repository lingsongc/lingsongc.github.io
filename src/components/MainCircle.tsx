import { useRef } from "react";
import type { Project } from "../data/projects";
import { useMainCircleScene } from "../motion/useMainCircleScene";

type MainCircleProps = {
    experienceImage: string;
    activeProject: Project;
};

export function MainCircle({ experienceImage, activeProject }: MainCircleProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef);

    return (
        <div ref={circleRef} className="main-circle-container" aria-hidden="true">
            <img className="main-circle-image main-circle-image-home" src="/about/profile.jpeg" alt="" />
            <img className="main-circle-image main-circle-image-about" src="/about/profile-2.jpg" alt="" />
            <img className="main-circle-image main-circle-image-experience" src={experienceImage} alt="" />
            <img className="main-circle-image main-circle-image-project" src={`/projects/${activeProject.id}.png`} alt="" />
            <p className="main-circle-project-description">{activeProject.summary}</p>
        </div>
    );
}
