import { useRef } from "react";
import type { Project } from "../data/projects";
import {
    experienceOrbitFrontPath,
    experienceOrbitLayerStyles,
    experienceOrbitViewBox,
} from "../motion/experienceOrbitGeometry";
import { useMainCircleScene } from "../motion/useMainCircleScene";

type MainCircleProps = {
    experienceImage: string;
    experienceVisible: boolean;
    onExperienceOrbitHostChange: (element: HTMLDivElement | null) => void;
    activeProject: Project;
};

export function MainCircle({
    experienceImage,
    experienceVisible,
    onExperienceOrbitHostChange,
    activeProject,
}: MainCircleProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef);

    return (
        <div
            ref={circleRef}
            className={`main-circle-container${experienceVisible ? " main-circle-experience-visible" : ""}`}
        >
            <svg width="0" height="0" aria-hidden="true">
                <defs>
                    <filter id="contact-goo" x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="contact-blur" />
                        <feColorMatrix
                            in="contact-blur"
                            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10"
                            result="contact-goo-alpha"
                        />
                        <feBlend in="SourceGraphic" in2="contact-goo-alpha" />
                    </filter>
                </defs>
            </svg>
            <div className="main-circle-mask" aria-hidden="true">
                <img className="main-circle-image main-circle-image-home" src="/about/profile.jpeg" alt="" />
                <img className="main-circle-image main-circle-image-about" src="/about/profile-2.jpg" alt="" />
                <img className="main-circle-image main-circle-image-experience" src={experienceImage} alt="" />
                <img className="main-circle-image main-circle-image-project" src={`/projects/${activeProject.id}.png`} alt="" />
                <p className="main-circle-project-description">{activeProject.summary}</p>
            </div>
            <div className="main-circle-experience-orbit-front" aria-hidden="true">
                <svg className="main-circle-experience-orbit-front-path" viewBox={experienceOrbitViewBox} style={experienceOrbitLayerStyles}>
                    <path className="main-circle-experience-orbit-stroke" d={experienceOrbitFrontPath} />
                </svg>
            </div>
            <div ref={onExperienceOrbitHostChange} className="main-circle-experience-orbit-host" />
            <div className="contact-blob-layer" aria-hidden="true">
                <span className="contact-blob-center" />
                <span className="contact-satellite contact-satellite-github" data-contact-link="github" />
                <span className="contact-satellite contact-satellite-instagram" data-contact-link="instagram" />
                <span className="contact-satellite contact-satellite-linkedin" data-contact-link="linkedin" />
            </div>
            <nav className="contact-link-layer" aria-label="Social profiles">
                <a className="contact-link contact-link-github" data-contact-link="github" href="https://github.com/lingsongc">GitHub</a>
                <a className="contact-link contact-link-instagram" data-contact-link="instagram" href="https://www.instagram.com/lingsongc/">Instagram</a>
                <a className="contact-link contact-link-linkedin" data-contact-link="linkedin" href="https://www.linkedin.com/in/lingsongc/">LinkedIn</a>
            </nav>
        </div>
    );
}
