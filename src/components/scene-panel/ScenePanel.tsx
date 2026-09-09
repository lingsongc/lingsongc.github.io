import { useLayoutEffect, useRef, type ReactNode, type RefObject } from "react";
import type { SceneId, ScenePhase } from "../../types/scene";

export type ScenePanelProps = {
    active: boolean;
    children: ReactNode;
    headingFocusTargetId: string;
    overflowRef?: RefObject<HTMLDivElement | null>;
    phase: ScenePhase;
    sceneId: SceneId;
};

// Provides one stacked scene with active semantics and local overflow ownership.
export function ScenePanel({
    active,
    children,
    headingFocusTargetId,
    overflowRef,
    phase,
    sceneId,
}: ScenePanelProps) {
    const localOverflowRef = useRef<HTMLDivElement>(null);
    const wasActiveRef = useRef(active);

    useLayoutEffect(() => {
        const overflowElement = localOverflowRef.current;
        if (!overflowRef || !overflowElement) return;

        if (active) {
            overflowRef.current = overflowElement;
            if (!wasActiveRef.current) overflowElement.scrollTop = 0;
        } else if (overflowRef.current === overflowElement) {
            overflowRef.current = null;
        }
        wasActiveRef.current = active;

        return () => {
            if (overflowRef.current === overflowElement) overflowRef.current = null;
        };
    }, [active, overflowRef]);

    return (
        <div
            className={`scene-panel${active ? " scene-panel-active" : ""}`}
            data-scene-id={sceneId}
            data-scene-phase={phase}
            aria-hidden={!active}
            inert={!active}
        >
            <div
                ref={localOverflowRef}
                className="scene-panel-overflow"
                aria-labelledby={headingFocusTargetId}
            >
                {children}
            </div>
        </div>
    );
}
