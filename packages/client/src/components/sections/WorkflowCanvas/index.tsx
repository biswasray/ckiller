import { useEffect, useMemo, useRef } from "react";
import type { DragEvent as ReactDragEvent } from "react";
import { useAppDispatch, useAppSelector, useTheme } from "../../../store/hooks";
import type { Skill } from "../../../interfaces";
import {
  addNode,
  duplicateNode,
  moveNode,
  removeNode,
  resetZoom,
  zoomIn,
  zoomOut,
} from "../../../store/workflowSlice";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { WorkflowCard } from "../WorkflowCard";

/** MIME type used to carry a skill name from the sidebar to the canvas. */
export const SKILL_DRAG_MIME = "application/x-skill-name";

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;

export function WorkflowCanvas() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { nodes, scale } = useAppSelector((state) => state.workflow);
  const groups = useAppSelector((state) => state.skills.groups);
  const containerRef = useRef<HTMLDivElement>(null);

  // name -> Skill lookup so each card can show its description.
  const skillsByName = useMemo(() => {
    const map = new Map<string, Skill>();
    groups.forEach((group) =>
      group.skills.forEach((skill) => map.set(skill.name, skill)),
    );
    return map;
  }, [groups]);

  // ctrl/⌘ + wheel zoom. Attached natively (non-passive) so preventDefault works.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      dispatch(e.deltaY < 0 ? zoomIn() : zoomOut());
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [dispatch]);

  const handleDrop = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const skillName = e.dataTransfer.getData(SKILL_DRAG_MIME);
    if (!skillName || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left + containerRef.current.scrollLeft) / scale;
    const y = (e.clientY - rect.top + containerRef.current.scrollTop) / scale;
    dispatch(addNode({ skillName, x, y }));
  };

  return (
    <div
      ref={containerRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={handleDrop}
      style={{
        position: "relative",
        flex: 1,
        overflow: "auto",
        background: theme.colors.background,
      }}
    >
      {/* Zoomed "world" — cards are positioned in unscaled world coordinates. */}
      <div
        style={{
          position: "relative",
          width: WORLD_WIDTH,
          height: WORLD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {nodes.map((node) => (
          <WorkflowCard
            key={node.id}
            node={node}
            skill={skillsByName.get(node.skillName)}
            scale={scale}
            onMove={(id, x, y) => dispatch(moveNode({ id, x, y }))}
            onDuplicate={(id) => dispatch(duplicateNode(id))}
            onDelete={(id) => dispatch(removeNode(id))}
          />
        ))}
      </div>

      {nodes.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: theme.colors.textDisabled,
            fontSize: theme.typography.fontSize.lg,
            pointerEvents: "none",
          }}
        >
          Drag a skill here to add it to the workflow
        </div>
      )}

      {/* Floating zoom toolbar (fixed to the viewport corner of the canvas). */}
      <div
        style={{
          position: "sticky",
          bottom: theme.spacing.lg,
          float: "right",
          marginRight: theme.spacing.lg,
          display: "inline-flex",
          alignItems: "center",
          gap: theme.spacing.sm,
          padding: theme.spacing.sm,
          borderRadius: theme.borderRadius.lg,
          background: theme.colors.surface,
          boxShadow: `0 2px 8px ${theme.colors.shadow}`,
        }}
      >
        <IconButton ariaLabel="Zoom out" onClick={() => dispatch(zoomOut())}>
          −
        </IconButton>
        <button
          type="button"
          onClick={() => dispatch(resetZoom())}
          title="Reset zoom"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            minWidth: 44,
          }}
        >
          <Label variant="muted">{Math.round(scale * 100)}%</Label>
        </button>
        <IconButton ariaLabel="Zoom in" onClick={() => dispatch(zoomIn())}>
          +
        </IconButton>
      </div>
    </div>
  );
}
