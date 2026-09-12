import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export type ScenePanelProps = {
    active: boolean;
    children: ReactNode;
    headingFocusTargetId: string;
    overflowRef?: RefObject<HTMLDivElement | null>;
};

// Provides one stacked scene with active semantics and local overflow ownership.
export function ScenePanel({
    active,
    children,
    headingFocusTargetId,
    overflowRef,
}: ScenePanelProps) {
    const localOverflowRef = useRef<HTMLDivElement>(null);
    const [overlayHost, setOverlayHost] = useState<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const overflowElement = localOverflowRef.current;
        if (!overflowRef || !overflowElement) return;

        if (active) {
            overflowRef.current = overflowElement;
            overflowElement.scrollTop = 0;
        } else if (overflowRef.current === overflowElement) {
            overflowRef.current = null;
        }
        return () => {
            if (overflowRef.current === overflowElement) overflowRef.current = null;
        };
    }, [active, overflowRef]);

    return (
        <div
            className={`scene-panel${active ? " scene-panel-active" : ""}`}
            aria-hidden={!active}
            inert={!active}
        >
            <ScenePanelOverlayContext value={overlayHost}>
                <div ref={localOverflowRef} className="scene-panel-overflow" aria-labelledby={headingFocusTargetId}>
                    {children}
                </div>
            </ScenePanelOverlayContext>
            <div ref={setOverlayHost} className="scene-panel-overlay" />
        </div>
    );
}

const ScenePanelOverlayContext = createContext<HTMLDivElement | null>(null);

// Renders section-owned foreground content into its panel's non-scrolling layer.
export function ScenePanelOverlay({ children }: { children: ReactNode }) {
    const host = useContext(ScenePanelOverlayContext);
    return host ? createPortal(children, host) : null;
}
