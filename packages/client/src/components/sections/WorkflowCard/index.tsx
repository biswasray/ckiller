import { useEffect, useRef, useState, useMemo } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useTheme } from "../../../store/hooks";
import { setAlpha, statusPalette } from "../../../utils";
import type { Skill } from "../../../interfaces";
import type { Port, WorkflowNode } from "../../../store/workflowSlice";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { TextInput } from "../../ui/TextInput";
import {
  CopyIcon,
  EditIcon,
  PlayIcon,
  SaveIcon,
  StoppedLoading,
  TrashIcon,
} from "../../ui/icons";
import type { WorkflowStatus } from "../../../store/workflowSlice";

const CARD_WIDTH = 260;
const PORTS: Port[] = ["top", "bottom", "left", "right"];

const PORT_POSITION: Record<Port, CSSProperties> = {
  top: { left: "50%", top: 0 },
  bottom: { left: "50%", top: "100%" },
  left: { left: 0, top: "50%" },
  right: { left: "100%", top: "50%" },
};

interface WorkflowCardProps {
  node: WorkflowNode;
  skill?: Skill;
  /** Current canvas zoom — drag deltas are divided by this to stay accurate. */
  scale: number;
  onMove: (id: string, x: number, y: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetTask: (id: string, task: string) => void;
  onSetStatus: (id: string, status: WorkflowStatus) => void;
  onResize: (id: string, w: number, h: number) => void;
  onPortPointerDown: (
    nodeId: string,
    port: Port,
    e: ReactPointerEvent<HTMLElement>,
  ) => void;
}

export function WorkflowCard({
  node,
  skill,
  scale,
  onMove,
  onDuplicate,
  onDelete,
  onSetTask,
  onSetStatus,
  onResize,
  onPortPointerDown,
}: WorkflowCardProps) {
  const { theme } = useTheme();
  const { accent, fill: _fill } = statusPalette(theme, node.status);

  const fill = useMemo(() => setAlpha(_fill, 0.12), [_fill]);
  // Pointer position at drag start and the node origin at that moment.
  const origin = useRef<{
    px: number;
    py: number;
    nx: number;
    ny: number;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.task ?? "");

  const inputMode = !node.task || editing;

  // Report the card's rendered size so the canvas can anchor connector ports.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const report = () => onResize(node.id, el.offsetWidth, el.offsetHeight);
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [node.id, onResize]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    origin.current = { px: e.clientX, py: e.clientY, nx: node.x, ny: node.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    const dx = (e.clientX - origin.current.px) / scale;
    const dy = (e.clientY - origin.current.py) / scale;
    onMove(node.id, origin.current.nx + dx, origin.current.ny + dy);
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    origin.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const saveTask = () => {
    onSetTask(node.id, draft);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(node.task ?? "");
    setEditing(true);
  };

  return (
    <div
      ref={rootRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: CARD_WIDTH,
        cursor: "grab",
        touchAction: "none",
      }}
    >
      {PORTS.map((port) => (
        <span
          key={port}
          data-node-id={node.id}
          data-port={port}
          title="Drag to connect"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown(node.id, port, e);
          }}
          style={{
            position: "absolute",
            ...PORT_POSITION[port],
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: theme.colors.surface,
            border: `2px solid ${accent}`,
            transform: "translate(-50%, -50%)",
            cursor: "crosshair",
            zIndex: 2,
          }}
        />
      ))}

      <Card
        style={{
          position: "relative",
          background: fill,
          // border: `2px solid ${accent}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: theme.spacing.sm,
            right: theme.spacing.sm,
            display: "flex",
            gap: theme.spacing.xs,
          }}
        >
          <IconButton
            ariaLabel="Duplicate card"
            onClick={() => onDuplicate(node.id)}
          >
            <CopyIcon />
          </IconButton>
          <IconButton ariaLabel="Delete card" onClick={() => onDelete(node.id)}>
            <TrashIcon />
          </IconButton>
        </div>

        <Label style={{ paddingRight: 72 }}>{node.skillName}</Label>

        {inputMode ? (
          <>
            <i
              style={{
                margin: `${theme.spacing.sm}px 0 0`,
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
                lineHeight: theme.typography.lineHeight.tight,
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {skill?.description ?? "Skill unavailable"}
            </i>
            {/* Drag guard: typing/selecting here must not start the card drag. */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: theme.spacing.sm,
                marginTop: theme.spacing.md,
              }}
            >
              <TextInput
                multiline
                rows={1}
                value={draft}
                onChange={setDraft}
                placeholder="Add a task…"
              />
              <IconButton ariaLabel="Save task" onClick={saveTask}>
                <SaveIcon />
              </IconButton>
            </div>
          </>
        ) : (
          <>
            <p
              style={{
                margin: `${theme.spacing.sm}px 0 0`,
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                lineHeight: theme.typography.lineHeight.normal,
                whiteSpace: "pre-wrap",
              }}
            >
              {node.task}
            </p>
            <div
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                gap: theme.spacing.sm,
                marginTop: theme.spacing.md,
              }}
            >
              <IconButton ariaLabel="Edit task" onClick={startEdit}>
                <EditIcon />
              </IconButton>
              {node.status === "running" ? (
                <IconButton
                  ariaLabel="Stop task"
                  onClick={() => onSetStatus(node.id, "idle")}
                >
                  <StoppedLoading color={accent} />
                </IconButton>
              ) : (
                <IconButton
                  ariaLabel="Run task"
                  onClick={() => onSetStatus(node.id, "running")}
                >
                  <PlayIcon />
                </IconButton>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
