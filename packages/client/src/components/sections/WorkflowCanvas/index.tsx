import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DragEvent as ReactDragEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { useAppDispatch, useAppSelector, useTheme } from "../../../store/hooks";
import { statusPalette } from "../../../utils";
import type { Skill } from "../../../interfaces";
import {
  addConnector,
  addGroup,
  addNode,
  duplicateNode,
  moveGroup,
  moveNode,
  removeConnector,
  removeGroup,
  removeNode,
  resetZoom,
  setGroupBounds,
  setGroupStatus,
  setNodeStatus,
  setTask,
  zoomIn,
  zoomOut,
} from "../../../store/workflowSlice";
import type {
  Port,
  WorkflowGroup as Group,
  WorkflowStatus,
} from "../../../store/workflowSlice";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { TrashIcon } from "../../ui/icons";
import { WorkflowCard } from "../WorkflowCard";
import { WorkflowGroup } from "../WorkflowGroup";

/** MIME type used to carry a skill name from the sidebar to the canvas. */
export const SKILL_DRAG_MIME = "application/x-skill-name";

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 2000;
const DEFAULT_CARD_WIDTH = 260;
const DEFAULT_CARD_HEIGHT = 120;
const CONTROL_OFFSET = 60;
/** Padding between a new group's edge and the items it wraps. */
const GROUP_PADDING = 24;

type Point = { x: number; y: number };
type Size = { w: number; h: number };
type Rect = { x: number; y: number; w: number; h: number };

const PORT_DIR: Record<Port, Point> = {
  top: { x: 0, y: -1 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function portPoint(rect: Rect, port: Port): Point {
  switch (port) {
    case "top":
      return { x: rect.x + rect.w / 2, y: rect.y };
    case "bottom":
      return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
    case "left":
      return { x: rect.x, y: rect.y + rect.h / 2 };
    case "right":
      return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
  }
}

/** Build a normalized rect from two corner points. */
function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

/** Recursively collect node + group ids nested under a group. */
function collectDescendants(
  groups: Group[],
  groupId: string,
  nodeIds: Set<string>,
  groupIds: Set<string>,
) {
  const group = groups.find((g) => g.id === groupId);
  if (!group) return;
  group.childNodeIds.forEach((id) => nodeIds.add(id));
  group.childGroupIds.forEach((id) => {
    if (groupIds.has(id)) return;
    groupIds.add(id);
    collectDescendants(groups, id, nodeIds, groupIds);
  });
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

interface WorkflowCanvasProps {
  /** When true, dragging on the canvas draws a marquee that groups the selection. */
  selectMode?: boolean;
  /** Called after a marquee selection successfully creates a group. */
  onExitSelect?: () => void;
}

export function WorkflowCanvas({
  selectMode = false,
  onExitSelect,
}: WorkflowCanvasProps) {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const {
    nodes,
    groups: wfGroups,
    connectors,
    scale,
  } = useAppSelector((state) => state.workflow);
  const skillGroups = useAppSelector((state) => state.skills.groups);
  const containerRef = useRef<HTMLDivElement>(null);

  const [sizes, setSizes] = useState<Record<string, Size>>({});
  const [pending, setPending] = useState<{
    sourceId: string;
    sourcePort: Port;
  } | null>(null);
  const [pointerWorld, setPointerWorld] = useState<Point | null>(null);
  const [marquee, setMarquee] = useState<{
    start: Point;
    current: Point;
  } | null>(null);

  // name -> Skill lookup so each card can show its description.
  const skillsByName = useMemo(() => {
    const map = new Map<string, Skill>();
    skillGroups.forEach((group) =>
      group.skills.forEach((skill) => map.set(skill.name, skill)),
    );
    return map;
  }, [skillGroups]);

  // id -> world-space rect for every connectable entity (nodes + groups).
  const entitiesById = useMemo(() => {
    const map = new Map<string, Rect>();
    nodes.forEach((node) => {
      const size = sizes[node.id];
      map.set(node.id, {
        x: node.x,
        y: node.y,
        w: size?.w ?? DEFAULT_CARD_WIDTH,
        h: size?.h ?? DEFAULT_CARD_HEIGHT,
      });
    });
    wfGroups.forEach((g) => map.set(g.id, { x: g.x, y: g.y, w: g.w, h: g.h }));
    return map;
  }, [nodes, wfGroups, sizes]);

  // id -> execution status, used to tint connectors by their source.
  const statusById = useMemo(() => {
    const map = new Map<string, WorkflowStatus>();
    nodes.forEach((node) => map.set(node.id, node.status));
    wfGroups.forEach((g) => map.set(g.id, g.status));
    return map;
  }, [nodes, wfGroups]);

  // Auto-fit each group's box around its children as they move/resize.
  useEffect(() => {
    if (wfGroups.length === 0) return;
    const byId = new Map(wfGroups.map((g) => [g.id, g]));
    const cache = new Map<string, Rect>();
    // Desired bounds = padded union of a group's direct children, recursing
    // into child groups so nested groups resolve to their own fitted bounds.
    const fit = (id: string): Rect | null => {
      const cached = cache.get(id);
      if (cached) return cached;
      const group = byId.get(id);
      if (!group) return null;
      const rects: Rect[] = [];
      group.childNodeIds.forEach((nid) => {
        const r = entitiesById.get(nid);
        if (r) rects.push(r);
      });
      group.childGroupIds.forEach((gid) => {
        const r = fit(gid);
        if (r) rects.push(r);
      });
      const bounds =
        rects.length === 0
          ? { x: group.x, y: group.y, w: group.w, h: group.h }
          : {
              x: Math.min(...rects.map((r) => r.x)) - GROUP_PADDING,
              y: Math.min(...rects.map((r) => r.y)) - GROUP_PADDING,
              w:
                Math.max(...rects.map((r) => r.x + r.w)) -
                Math.min(...rects.map((r) => r.x)) +
                GROUP_PADDING * 2,
              h:
                Math.max(...rects.map((r) => r.y + r.h)) -
                Math.min(...rects.map((r) => r.y)) +
                GROUP_PADDING * 2,
            };
      cache.set(id, bounds);
      return bounds;
    };
    wfGroups.forEach((g) => {
      const b = fit(g.id);
      if (!b) return;
      if (
        Math.abs(b.x - g.x) > 0.5 ||
        Math.abs(b.y - g.y) > 0.5 ||
        Math.abs(b.w - g.w) > 0.5 ||
        Math.abs(b.h - g.h) > 0.5
      ) {
        dispatch(setGroupBounds({ id: g.id, ...b }));
      }
    });
  }, [nodes, wfGroups, entitiesById, dispatch]);

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
      const source = entitiesById.get(connector.sourceId);
      const target = entitiesById.get(connector.targetId);
      if (!source || !target) return null;
      const { d, mid } = bezier(
        portPoint(source, connector.sourcePort),
        connector.sourcePort,
        portPoint(target, connector.targetPort),
        connector.targetPort,
      );
      const color = statusPalette(theme, statusById.get(connector.sourceId))
        .accent;
      return { id: connector.id, d, mid, color };
    })
    .filter(
      (c): c is { id: string; d: string; mid: Point; color: string } =>
        c !== null,
    );

  const pendingPath = (() => {
    if (!pending || !pointerWorld) return null;
    const source = entitiesById.get(pending.sourceId);
    if (!source) return null;
    const src = portPoint(source, pending.sourcePort);
    return bezier(src, pending.sourcePort, pointerWorld, "left").d;
  })();

  // Marquee (selection tool): build a group from everything it overlaps.
  const finishMarquee = (m: { start: Point; current: Point }) => {
    const area = rectFromPoints(m.start, m.current);
    if (area.w < 8 && area.h < 8) return; // ignore stray clicks

    const hitNodeIds = nodes
      .filter((n) => {
        const r = entitiesById.get(n.id);
        return r && rectsIntersect(area, r);
      })
      .map((n) => n.id);
    const hitGroupIds = wfGroups
      .filter((g) => rectsIntersect(area, { x: g.x, y: g.y, w: g.w, h: g.h }))
      .map((g) => g.id);

    // Keep only top-level picks: drop anything already nested in a picked group.
    const nested = { nodes: new Set<string>(), groups: new Set<string>() };
    hitGroupIds.forEach((id) =>
      collectDescendants(wfGroups, id, nested.nodes, nested.groups),
    );
    const childNodeIds = hitNodeIds.filter((id) => !nested.nodes.has(id));
    const childGroupIds = hitGroupIds.filter((id) => !nested.groups.has(id));
    if (childNodeIds.length + childGroupIds.length === 0) return;

    // Wrap the union of the chosen items' bounds, padded a little.
    const rects = [...childNodeIds, ...childGroupIds]
      .map((id) => entitiesById.get(id))
      .filter((r): r is Rect => Boolean(r));
    const minX = Math.min(...rects.map((r) => r.x));
    const minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w));
    const maxY = Math.max(...rects.map((r) => r.y + r.h));

    dispatch(
      addGroup({
        x: minX - GROUP_PADDING,
        y: minY - GROUP_PADDING,
        w: maxX - minX + GROUP_PADDING * 2,
        h: maxY - minY + GROUP_PADDING * 2,
        childNodeIds,
        childGroupIds,
      }),
    );
    onExitSelect?.();
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
        {/* Connector layer — paints below the cards. */}
        <svg
          width={WORLD_WIDTH}
          height={WORLD_HEIGHT}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
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
              {/* context-stroke makes the arrowhead inherit each path's color. */}
              <path d="M0,0 L8,3 L0,6 Z" fill="context-stroke" />
            </marker>
          </defs>
          {drawnConnectors.map((c) => (
            <path
              key={c.id}
              d={c.d}
              fill="none"
              stroke={c.color}
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

        {/* Group rectangles — painted beneath the cards they contain. */}
        {wfGroups.map((group) => (
          <WorkflowGroup
            key={group.id}
            group={group}
            scale={scale}
            onMove={(id, x, y) => dispatch(moveGroup({ id, x, y }))}
            onSetStatus={(id, status) => dispatch(setGroupStatus({ id, status }))}
            onDelete={(id) => dispatch(removeGroup(id))}
            onPortPointerDown={handlePortPointerDown}
          />
        ))}

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
            onSetStatus={(id, status) => dispatch(setNodeStatus({ id, status }))}
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

        {/* Marquee overlay — only while the selection tool is active. */}
        {selectMode && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              const start = toWorld(e.clientX, e.clientY);
              setMarquee({ start, current: start });
            }}
            onPointerMove={(e) => {
              setMarquee((prev) =>
                prev
                  ? { ...prev, current: toWorld(e.clientX, e.clientY) }
                  : prev,
              );
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              // Run side effects (dispatch / onExitSelect) outside the state
              // updater — updaters must stay pure.
              if (marquee) finishMarquee(marquee);
              setMarquee(null);
            }}
            style={{
              position: "absolute",
              inset: 0,
              cursor: "crosshair",
              zIndex: 5,
            }}
          >
            {marquee &&
              (() => {
                const r = rectFromPoints(marquee.start, marquee.current);
                return (
                  <div
                    style={{
                      position: "absolute",
                      left: r.x,
                      top: r.y,
                      width: r.w,
                      height: r.h,
                      border: "2px dashed #3B82F6",
                      background: "rgba(59, 130, 246, 0.08)",
                      pointerEvents: "none",
                    }}
                  />
                );
              })()}
          </div>
        )}
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
