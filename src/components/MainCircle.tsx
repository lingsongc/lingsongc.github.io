import { useRef } from "react";
import { useMainCircleScene } from "../motion/useMainCircleScene";

type MainCircleProps = {
    experienceImage: string;
};

export function MainCircle({ experienceImage }: MainCircleProps) {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef);

    return (
        <div ref={circleRef} className="main-circle-container" aria-hidden="true">
            <img className="main-circle-image main-circle-image-home" src="/about/profile.jpeg" alt="" />
            <img className="main-circle-image main-circle-image-about" src="/about/profile-2.jpg" alt="" />
            <img className="main-circle-image main-circle-image-experience" src={experienceImage} alt="" />
        </div>
    );
}
