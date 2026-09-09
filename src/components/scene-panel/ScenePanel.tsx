import type { ReactNode, RefObject } from "react";
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
    return (
        <div
            className={`scene-panel${active ? " scene-panel-active" : ""}`}
            data-scene-id={sceneId}
            data-scene-phase={phase}
            aria-hidden={!active}
            inert={!active}
        >
            <div
                ref={active ? overflowRef : undefined}
                className="scene-panel-overflow"
                aria-labelledby={headingFocusTargetId}
            >
                {children}
            </div>
        </div>
    );
}
