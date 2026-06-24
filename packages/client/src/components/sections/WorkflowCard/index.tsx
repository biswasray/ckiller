import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useTheme } from "../../../store/hooks";
import type { Skill } from "../../../interfaces";
import type { WorkflowNode } from "../../../store/workflowSlice";
import { Card } from "../../ui/Card";
import { IconButton } from "../../ui/IconButton";
import { Label } from "../../ui/Label";
import { CopyIcon, TrashIcon } from "../../ui/icons";

const CARD_WIDTH = 260;

interface WorkflowCardProps {
  node: WorkflowNode;
  skill?: Skill;
  /** Current canvas zoom — drag deltas are divided by this to stay accurate. */
  scale: number;
  onMove: (id: string, x: number, y: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkflowCard({
  node,
  skill,
  scale,
  onMove,
  onDuplicate,
  onDelete,
}: WorkflowCardProps) {
  const { theme } = useTheme();
  // Pointer position at drag start and the node origin at that moment.
  const origin = useRef<{ px: number; py: number; nx: number; ny: number } | null>(
    null,
  );

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
        <p
          style={{
            margin: `${theme.spacing.sm}px 0 0`,
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            lineHeight: theme.typography.lineHeight.normal,
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {skill?.description ?? "Skill unavailable"}
        </p>
      </Card>
    </div>
  );
}
