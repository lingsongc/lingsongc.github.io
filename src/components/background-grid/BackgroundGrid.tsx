import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef } from "react";
import type { MainCircleEndpoint } from "../../types/mainCircle";
import { createWarpedGridPaths } from "./backgroundGridGeometry";

const GRID_SPACING = 48;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const FEEDBACK_EPSILON = 0.001;

type BackgroundGridProps = {
    circleGeometry?: MainCircleEndpoint | null;
};

export type BackgroundGridHandle = {
    setScrollFeedback: (progress: number, durationMs?: number) => void;
};

type FeedbackAnimation = {
    durationMs: number;
    from: number;
    startedAt: number;
    to: number;
};

// Renders a fixed SVG grid that bends and fades around the main circle.
export const BackgroundGrid = forwardRef<BackgroundGridHandle, BackgroundGridProps>(function BackgroundGrid(
    { circleGeometry = null },
    ref,
) {
    const linesRef = useRef<SVGGElement>(null);
    const fadeCircleRef = useRef<SVGCircleElement>(null);
    const feedbackAnimationRef = useRef<FeedbackAnimation | null>(null);
    const feedbackFrameRef = useRef<number | undefined>(undefined);
    const feedbackProgressRef = useRef(0);
    const renderRef = useRef<() => void>(() => undefined);
    const filterId = useId();
    const maskId = useId();

    // Interpolates between wheel-event targets so discrete notches never step the SVG paths.
    const animateScrollFeedback = useCallback((now: number) => {
        const animation = feedbackAnimationRef.current;
        if (!animation) return;

        const timeProgress = animation.durationMs <= 0
            ? 1
            : Math.min(1, (now - animation.startedAt) / animation.durationMs);
        const easedProgress = 1 - Math.pow(1 - timeProgress, 3);
        feedbackProgressRef.current = animation.from
            + (animation.to - animation.from) * easedProgress;
        renderRef.current();

        if (timeProgress < 1) {
            feedbackFrameRef.current = requestAnimationFrame(animateScrollFeedback);
            return;
        }
        feedbackProgressRef.current = Math.abs(animation.to) < FEEDBACK_EPSILON ? 0 : animation.to;
        feedbackAnimationRef.current = null;
        feedbackFrameRef.current = undefined;
    }, []);

    useImperativeHandle(ref, () => ({
        setScrollFeedback(progress, durationMs = 140) {
            const target = Math.min(1, Math.max(-1, progress));
            cancelAnimationFrame(feedbackFrameRef.current ?? 0);
            feedbackAnimationRef.current = {
                durationMs,
                from: feedbackProgressRef.current,
                startedAt: performance.now(),
                to: target,
            };
            feedbackFrameRef.current = requestAnimationFrame(animateScrollFeedback);
        },
    }), [animateScrollFeedback]);

    // Stops the temporary feedback animation when the grid unmounts.
    useEffect(() => () => cancelAnimationFrame(feedbackFrameRef.current ?? 0), []);

    // Rebuilds the grid when its circle geometry changes and exposes the current renderer to feedback frames.
    useEffect(() => {
        const lines = linesRef.current;
        const fadeCircle = fadeCircleRef.current;
        if (!lines || !fadeCircle) return;

        const pathElements = [...lines.querySelectorAll<SVGPathElement>("path")];
        const circle = circleGeometry ? {
            x: circleGeometry.left,
            y: circleGeometry.top,
            radius: circleGeometry.width / 2,
        } : null;
        const render = () => {
            if (document.hidden) return;
            const circleSignature = circle
                ? `${circle.x.toFixed(1)}:${circle.y.toFixed(1)}:${circle.radius.toFixed(1)}`
                : "static";
            const feedbackSignature = feedbackProgressRef.current.toFixed(4);
            const signature = `${innerWidth}:${innerHeight}:${circleSignature}:${feedbackSignature}`;
            if (lines.dataset.signature !== signature) {
                lines.dataset.signature = signature;
                const pathData = createWarpedGridPaths(
                    innerWidth,
                    innerHeight,
                    circle,
                    GRID_SPACING,
                    feedbackProgressRef.current,
                );

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
        };
        const handleVisibilityChange = () => {
            if (!document.hidden) render();
        };
        renderRef.current = render;
        render();
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            if (renderRef.current === render) renderRef.current = () => undefined;
        };
    }, [circleGeometry]);

    return (
        <>
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

        </>
    );
});
