import { useEffect, useId, useRef, type RefObject } from "react";
import { createWarpedGridPaths } from "../motion/gridGeometry";

const GRID_SPACING = 48;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

type BackgroundGridProps = {
    warpTargetRef?: RefObject<HTMLElement | null>;
};

export function BackgroundGrid({ warpTargetRef }: BackgroundGridProps) {
    const linesRef = useRef<SVGGElement>(null);
    const fadeCircleRef = useRef<SVGCircleElement>(null);
    const filterId = useId();
    const maskId = useId();

    useEffect(() => {
        const lines = linesRef.current;
        const fadeCircle = fadeCircleRef.current;
        if (!lines || !fadeCircle) return;

        const pathElements: SVGPathElement[] = [];
        let animationFrame = 0;
        let lastSignature = "";

        const render = () => {
            if (!document.hidden) {
                const warpTarget = warpTargetRef?.current;
                const rect = warpTarget?.getBoundingClientRect();
                const circle = rect
                    ? {
                        x: rect.left + rect.width / 2,
                        y: rect.top + rect.height / 2,
                        radius: Math.min(rect.width, rect.height) / 2,
                    }
                    : null;
                const circleSignature = circle
                    ? `${circle.x.toFixed(1)}:${circle.y.toFixed(1)}:${circle.radius.toFixed(1)}`
                    : "static";
                const signature = `${innerWidth}:${innerHeight}:${circleSignature}`;

                if (signature !== lastSignature) {
                    lastSignature = signature;
                    const pathData = createWarpedGridPaths(innerWidth, innerHeight, circle, 0, GRID_SPACING);

                    while (pathElements.length < pathData.length) {
                        const path = document.createElementNS(SVG_NAMESPACE, "path");
                        lines.append(path);
                        pathElements.push(path);
                    }
                    while (pathElements.length > pathData.length) pathElements.pop()?.remove();
                    pathData.forEach((data, index) => pathElements[index].setAttribute("d", data));

                    if (circle) {
                        fadeCircle.setAttribute("cx", circle.x.toString());
                        fadeCircle.setAttribute("cy", circle.y.toString());
                        fadeCircle.setAttribute("r", (circle.radius + 24).toString());
                    } else {
                        fadeCircle.setAttribute("r", "0");
                    }
                }
            }

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, [warpTargetRef]);

    return (
        <svg className="background-grid" aria-hidden="true">
            <defs>
                <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="32" />
                </filter>
                <mask id={maskId} maskUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="white" />
                    <circle ref={fadeCircleRef} fill="black" filter={`url(#${filterId})`} />
                </mask>
            </defs>
            <g ref={linesRef} className="background-grid-lines" mask={`url(#${maskId})`} />
        </svg>
    );
}
