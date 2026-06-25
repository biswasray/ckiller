import { useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useTheme } from "../../../store/hooks";
import { statusPalette } from "../../../utils";
import type {
  Port,
  WorkflowGroup as Group,
} from "../../../store/workflowSlice";
import { IconButton } from "../../ui/IconButton";
import { PlayIcon, StoppedLoading, TrashIcon } from "../../ui/icons";
import type { WorkflowStatus } from "../../../store/workflowSlice";

const PORTS: Port[] = ["top", "bottom", "left", "right"];

const PORT_POSITION: Record<Port, CSSProperties> = {
  top: { left: "50%", top: 0 },
  bottom: { left: "50%", top: "100%" },
  left: { left: 0, top: "50%" },
  right: { left: "100%", top: "50%" },
};

interface WorkflowGroupProps {
  group: Group;
  /** Current canvas zoom — drag deltas are divided by this to stay accurate. */
  scale: number;
  onMove: (id: string, x: number, y: number) => void;
  onSetStatus: (id: string, status: WorkflowStatus) => void;
  onDelete: (id: string) => void;
  onPortPointerDown: (
    groupId: string,
    port: Port,
    e: ReactPointerEvent<HTMLElement>,
  ) => void;
}

export function WorkflowGroup({
  group,
  scale,
  onMove,
  onSetStatus,
  onDelete,
  onPortPointerDown,
}: WorkflowGroupProps) {
  const { theme } = useTheme();
  const { accent, fill } = statusPalette(theme, group.status);
  // Pointer position at drag start and the group origin at that moment.
  const origin = useRef<{
    px: number;
    py: number;
    gx: number;
    gy: number;
  } | null>(null);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    origin.current = { px: e.clientX, py: e.clientY, gx: group.x, gy: group.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!origin.current) return;
    const dx = (e.clientX - origin.current.px) / scale;
    const dy = (e.clientY - origin.current.py) / scale;
    onMove(group.id, origin.current.gx + dx, origin.current.gy + dy);
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
        left: 0,
        top: 0,
        // Position via transform (not left/top) so the translucent box gets its
        // own compositor layer — avoids the repaint "ghost" left behind on drag.
        transform: `translate(${group.x}px, ${group.y}px)`,
        willChange: "transform",
        width: group.w,
        height: group.h,
        boxSizing: "border-box",
        border: `2px dashed ${accent}`,
        borderRadius: theme.borderRadius.md,
        background: fill,
        cursor: "grab",
        touchAction: "none",
        zIndex: 0,
      }}
    >
      {PORTS.map((port) => (
        <span
          key={port}
          data-node-id={group.id}
          data-port={port}
          title="Drag to connect"
          onPointerDown={(e) => {
            e.stopPropagation();
            onPortPointerDown(group.id, port, e);
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

      <div
        style={{
          position: "absolute",
          top: theme.spacing.xs,
          right: theme.spacing.xs,
          display: "flex",
          gap: theme.spacing.xs,
        }}
      >
        {group.status === "running" ? (
          <IconButton
            ariaLabel="Stop group"
            onClick={() => onSetStatus(group.id, "idle")}
          >
            <StoppedLoading color={accent} />
          </IconButton>
        ) : (
          <IconButton
            ariaLabel="Run group"
            onClick={() => onSetStatus(group.id, "running")}
          >
            <PlayIcon />
          </IconButton>
        )}
        <IconButton
          ariaLabel="Dissolve group"
          onClick={() => onDelete(group.id)}
        >
          <TrashIcon />
        </IconButton>
      </div>
    </div>
  );
}
