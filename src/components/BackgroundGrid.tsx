import { useEffect, useRef } from "react";
import { createWarpedGridPaths } from "../motion/gridGeometry";

const GRID_SPACING = 48;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

export function BackgroundGrid() {
    const linesRef = useRef<SVGGElement>(null);
    const fadeCircleRef = useRef<SVGCircleElement>(null);

    useEffect(() => {
        const lines = linesRef.current;
        const fadeCircle = fadeCircleRef.current;
        const mainCircle = document.querySelector<HTMLElement>(".main-circle-container");
        if (!lines || !fadeCircle || !mainCircle) return;

        const pathElements: SVGPathElement[] = [];
        let animationFrame = 0;
        let lastSignature = "";

        const render = () => {
            if (!document.hidden) {
                const rect = mainCircle.getBoundingClientRect();
                const circle = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2,
                    radius: Math.min(rect.width, rect.height) / 2,
                };
                const signature = `${innerWidth}:${innerHeight}:${circle.x.toFixed(1)}:${circle.y.toFixed(1)}:${circle.radius.toFixed(1)}`;

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

                    fadeCircle.setAttribute("cx", circle.x.toString());
                    fadeCircle.setAttribute("cy", circle.y.toString());
                    fadeCircle.setAttribute("r", (circle.radius + 24).toString());
                }
            }

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animationFrame);
    }, []);

    return (
        <svg className="background-grid" aria-hidden="true">
            <defs>
                <filter id="background-grid-blur" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="32" />
                </filter>
                <mask id="background-grid-mask" maskUnits="userSpaceOnUse">
                    <rect width="100%" height="100%" fill="white" />
                    <circle ref={fadeCircleRef} fill="black" filter="url(#background-grid-blur)" />
                </mask>
            </defs>
            <g ref={linesRef} className="background-grid-lines" mask="url(#background-grid-mask)" />
        </svg>
    );
}
