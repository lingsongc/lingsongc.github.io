import { useRef } from "react";
import { useMainCircleScene } from "../motion/useMainCircleScene";

export function MainCircle() {
    const circleRef = useRef<HTMLDivElement>(null);

    useMainCircleScene(circleRef);

    return (
        <div ref={circleRef} className="main-circle-container" aria-hidden="true">
            <img className="main-circle-image main-circle-image-home" src="/profile.jpeg" alt="" />
            <img className="main-circle-image main-circle-image-about" src="/profile-2.jpg" alt="" />
            <img className="main-circle-image main-circle-image-experience" src="/ns.jpg" alt="" />
        </div>
    );
}
