import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from "react";
import { useAppDispatch, useAppSelector, useTheme } from "../../../store/hooks";
import type { Skill } from "../../../interfaces";
import {
  addConnector,
  addNode,
  duplicateNode,
  moveNode,
  removeConnector,
  removeNode,
  resetZoom,
  setTask,
  zoomIn,
  zoomOut,
} from "../../../store/workflowSlice";
import type { Port, WorkflowNode } from "../../../store/workflowSlice";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { TrashIcon } from "../../ui/icons";
import { WorkflowCard } from "../WorkflowCard";

/** MIME type used to carry a skill name from the sidebar to the canvas. */
export const SKILL_DRAG_MIME = "application/x-skill-name";

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;
const DEFAULT_CARD_WIDTH = 260;
const DEFAULT_CARD_HEIGHT = 120;
const CONTROL_OFFSET = 60;

type Point = { x: number; y: number };
type Size = { w: number; h: number };

const PORT_DIR: Record<Port, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function portPoint(node: WorkflowNode, port: Port, size?: Size): Point {
  const w = size?.w ?? DEFAULT_CARD_WIDTH;
  const h = size?.h ?? DEFAULT_CARD_HEIGHT;
  switch (port) {
    case "top":
      return { x: node.x + w / 2, y: node.y };
    case "bottom":
      return { x: node.x + w / 2, y: node.y + h };
    case "left":
      return { x: node.x, y: node.y + h / 2 };
    case "right":
      return { x: node.x + w, y: node.y + h / 2 };
  }
}

/** Cubic bezier path string + its midpoint (t=0.5) for the delete icon. */
function bezier(src: Point, srcPort: Port, tgt: Point, tgtPort: Port) {
  const c1 = {
    x: src.x + PORT_DIR[srcPort].x * CONTROL_OFFSET,
    y: src.y + PORT_DIR[srcPort].y * CONTROL_OFFSET,
  };
  const c2 = {
    x: tgt.x + PORT_DIR[tgtPort].x * CONTROL_OFFSET,
    y: tgt.y + PORT_DIR[tgtPort].y * CONTROL_OFFSET,
  };
  const d = `M ${src.x} ${src.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${tgt.x} ${tgt.y}`;
  const mid = {
    x: 0.125 * src.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * tgt.x,
    y: 0.125 * src.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * tgt.y,
  };
  return { d, mid };
}

export function WorkflowCanvas() {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { nodes, connectors, scale } = useAppSelector((state) => state.workflow);
  const groups = useAppSelector((state) => state.skills.groups);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [pending, setPending] = useState<{
    sourceId: string;
    sourcePort: Port;
  } | null>(null);
  const [pointerWorld, setPointerWorld] = useState<Point | null>(null);

  // name -> Skill lookup so each card can show its description.
  const skillsByName = useMemo(() => {
    const map = new Map<string, Skill>();
    groups.forEach((group) =>
      group.skills.forEach((skill) => map.set(skill.name, skill)),
    );
    return map;
  }, [groups]);

  const nodesById = useMemo(() => {
    const map = new Map<string, WorkflowNode>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  const handleResize = useCallback((id: string, w: number, h: number) => {
    setSizes((prev) => {
      const cur = prev[id];
      if (cur && cur.w === w && cur.h === h) return prev;
      return { ...prev, [id]: { w, h } };
    });
  }, []);

  // Convert a viewport pointer position to world coordinates.
  const toWorld = useCallback(
    (clientX: number, clientY: number): Point => {
      const el = containerRef.current;
      if (!el) return { x: 0, y: 0 };
      const rect = el.getBoundingClientRect();
      return {
        x: (clientX - rect.left + el.scrollLeft) / scale,
        y: (clientY - rect.top + el.scrollTop) / scale,
      };
    },
    [scale],
  );

  const handlePortPointerDown = useCallback(
    (sourceId: string, sourcePort: Port, e: ReactPointerEvent<HTMLElement>) => {
      setPending({ sourceId, sourcePort });
      setPointerWorld(toWorld(e.clientX, e.clientY));
    },
    [toWorld],
  );

  // While linking, track the cursor and finalize/cancel on pointer up.
  useEffect(() => {
    if (!pending) return;
    const onMove = (e: PointerEvent) =>
      setPointerWorld(toWorld(e.clientX, e.clientY));
    const onUp = (e: PointerEvent) => {
      const target = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest<HTMLElement>("[data-port]");
      const targetId = target?.dataset.nodeId;
      const targetPort = target?.dataset.port as Port | undefined;
      if (targetId && targetPort && targetId !== pending.sourceId) {
        dispatch(
          addConnector({
            sourceId: pending.sourceId,
            sourcePort: pending.sourcePort,
            targetId,
            targetPort,
          }),
        );
      }
      setPending(null);
      setPointerWorld(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [pending, toWorld, dispatch]);

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
    if (!skillName) return;
    const { x, y } = toWorld(e.clientX, e.clientY);
    dispatch(addNode({ skillName, x, y }));
  };

  // Resolve each connector to drawable geometry, skipping dangling ones.
  const drawnConnectors = connectors
    .map((connector) => {
      const source = nodesById.get(connector.sourceId);
      const target = nodesById.get(connector.targetId);
      if (!source || !target) return null;
      const { d, mid } = bezier(
        portPoint(source, connector.sourcePort, sizes[source.id]),
        connector.sourcePort,
        portPoint(target, connector.targetPort, sizes[target.id]),
        connector.targetPort,
      );
      return { id: connector.id, d, mid };
    })
    .filter((c): c is { id: string; d: string; mid: Point } => c !== null);

  const pendingPath = (() => {
    if (!pending || !pointerWorld) return null;
    const source = nodesById.get(pending.sourceId);
    if (!source) return null;
    const src = portPoint(source, pending.sourcePort, sizes[source.id]);
    return bezier(src, pending.sourcePort, pointerWorld, "left").d;
  })();

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
        {/* Connector layer — paints below the cards. */}
        <svg
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        >
          <defs>
            <marker
              id="wf-arrow"
              markerWidth={10}
              markerHeight={8}
              refX={8}
              refY={3}
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L8,3 L0,6 Z" fill={theme.colors.textSecondary} />
            </marker>
          </defs>
          {drawnConnectors.map((c) => (
            <path
              key={c.id}
              d={c.d}
              fill="none"
              stroke={theme.colors.textSecondary}
              strokeWidth={2}
              markerEnd="url(#wf-arrow)"
            />
          ))}
          {pendingPath && (
            <path
              d={pendingPath}
              fill="none"
              stroke={theme.colors.textSecondary}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
        </svg>

        {nodes.map((node) => (
          <WorkflowCard
            key={node.id}
            node={node}
            skill={skillsByName.get(node.skillName)}
            scale={scale}
            onMove={(id, x, y) => dispatch(moveNode({ id, x, y }))}
            onDuplicate={(id) => dispatch(duplicateNode(id))}
            onDelete={(id) => dispatch(removeNode(id))}
            onSetTask={(id, task) => dispatch(setTask({ id, task }))}
            onRun={(id) => console.log("run", id)}
            onResize={handleResize}
            onPortPointerDown={handlePortPointerDown}
          />
        ))}

        {/* Connector delete icons — painted above cards, positioned at midpoints. */}
        {drawnConnectors.map((c) => (
          <div
            key={c.id}
            style={{
              position: "absolute",
              left: c.mid.x,
              top: c.mid.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <IconButton
              ariaLabel="Delete connector"
              size={24}
              onClick={() => dispatch(removeConnector(c.id))}
            >
              <TrashIcon size={14} />
            </IconButton>
          </div>
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
