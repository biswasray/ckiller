import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useTheme } from "../../../store/hooks";
import type { Skill } from "../../../interfaces";
import type { WorkflowNode } from "../../../store/workflowSlice";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { TextInput } from "../../ui/TextInput";
import {
  CopyIcon,
  EditIcon,
  PlayIcon,
  SaveIcon,
  TrashIcon,
} from "../../ui/icons";

const CARD_WIDTH = 260;

interface WorkflowCardProps {
  node: WorkflowNode;
  skill?: Skill;
  /** Current canvas zoom — drag deltas are divided by this to stay accurate. */
  scale: number;
  onMove: (id: string, x: number, y: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onSetTask: (id: string, task: string) => void;
  onRun: (id: string) => void;
}

export function WorkflowCard({
  node,
  skill,
  scale,
  onMove,
  onDuplicate,
  onDelete,
  onSetTask,
  onRun,
}: WorkflowCardProps) {
  const { theme } = useTheme();
  // Pointer position at drag start and the node origin at that moment.
  const origin = useRef<{
    px: number;
    py: number;
    nx: number;
    ny: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.task ?? "");

  const inputMode = !node.task || editing;

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
      <Card style={{ position: "relative" }}>
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
              <IconButton ariaLabel="Run task" onClick={() => onRun(node.id)}>
                <PlayIcon />
              </IconButton>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
