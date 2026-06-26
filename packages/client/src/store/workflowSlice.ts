import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./index";

/** Execution state of a node or group, used to drive its color. */
export type WorkflowStatus = "idle" | "running" | "success" | "failed";

export interface WorkflowNode {
  id: string;
  skillName: string;
  x: number;
  y: number;
  task?: string;
  status: WorkflowStatus;
}

export type Port = "top" | "bottom" | "left" | "right";

/**
 * A rectangular container that visually groups nodes and/or other groups.
 * It is connectable like a node, but never to its own descendants.
 */
export interface WorkflowGroup {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  childNodeIds: string[];
  childGroupIds: string[];
  status: WorkflowStatus;
}

export interface WorkflowConnector {
  id: string;
  sourceId: string;
  sourcePort: Port;
  targetId: string;
  targetPort: Port;
}

/** The canvas contents of a single workflow. */
export interface WorkflowBoard {
  nodes: WorkflowNode[];
  groups: WorkflowGroup[];
  connectors: WorkflowConnector[];
  scale: number;
}

/** A named, persisted workflow. Exactly one is `isDisplayed` at a time. */
export interface Workflow {
  id: string;
  title: string;
  createdAt: string;
  isDisplayed: boolean;
  workflowBoard: WorkflowBoard;
}

interface WorkflowState {
  workflows: Workflow[];
}

/** Collect every node and group nested (directly or transitively) under a group. */
function collectDescendants(
  groups: WorkflowGroup[],
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

/** True when `candidateId` lives inside the group identified by `groupId`. */
function isDescendant(
  groups: WorkflowGroup[],
  groupId: string,
  candidateId: string,
): boolean {
  const nodeIds = new Set<string>();
  const groupIds = new Set<string>();
  collectDescendants(groups, groupId, nodeIds, groupIds);
  return nodeIds.has(candidateId) || groupIds.has(candidateId);
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 2;
const SCALE_STEP = 0.1;
const DUPLICATE_OFFSET = 24;

const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));

/** A fresh, empty canvas. */
export const emptyBoard = (): WorkflowBoard => ({
  nodes: [],
  groups: [],
  connectors: [],
  scale: 1,
});

/** Build a new (displayed) workflow, optionally seeded with an existing board. */
export const makeWorkflow = (
  title = "Unnamed",
  board: WorkflowBoard = emptyBoard(),
): Workflow => ({
  id: nanoid(),
  title,
  createdAt: new Date().toISOString(),
  isDisplayed: true,
  workflowBoard: board,
});

/** The board of the currently displayed workflow (a draft, when inside a reducer). */
const activeBoard = (state: WorkflowState): WorkflowBoard | undefined =>
  state.workflows.find((w) => w.isDisplayed)?.workflowBoard;

const initialState: WorkflowState = {
  workflows: [makeWorkflow("Unnamed")],
};

export const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    addNode: {
      reducer: (state, action: PayloadAction<WorkflowNode>) => {
        const board = activeBoard(state);
        if (!board) return;
        board.nodes.push(action.payload);
      },
      prepare: (input: { skillName: string; x: number; y: number }) => ({
        payload: { id: nanoid(), status: "idle" as const, ...input },
      }),
    },
    moveNode: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>,
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const node = board.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.x = action.payload.x;
        node.y = action.payload.y;
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      if (!board) return;
      const id = action.payload;
      board.nodes = board.nodes.filter((n) => n.id !== id);
      board.connectors = board.connectors.filter(
        (c) => c.sourceId !== id && c.targetId !== id,
      );
      board.groups.forEach((g) => {
        g.childNodeIds = g.childNodeIds.filter((cid) => cid !== id);
      });
    },
    duplicateNode: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      if (!board) return;
      const node = board.nodes.find((n) => n.id === action.payload);
      if (node) {
        board.nodes.push({
          id: nanoid(),
          skillName: node.skillName,
          x: node.x + DUPLICATE_OFFSET,
          y: node.y + DUPLICATE_OFFSET,
          task: node.task,
          status: "idle",
        });
      }
    },
    setTask: (state, action: PayloadAction<{ id: string; task: string }>) => {
      const board = activeBoard(state);
      if (!board) return;
      const node = board.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.task = action.payload.task.trim() || undefined;
      }
    },
    setNodeStatus: (
      state,
      action: PayloadAction<{ id: string; status: WorkflowStatus }>,
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const node = board.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.status = action.payload.status;
      }
    },
    setGroupStatus: (
      state,
      action: PayloadAction<{ id: string; status: WorkflowStatus }>,
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const group = board.groups.find((g) => g.id === action.payload.id);
      if (group) {
        group.status = action.payload.status;
      }
    },
    addGroup: {
      reducer: (state, action: PayloadAction<WorkflowGroup>) => {
        const board = activeBoard(state);
        if (!board) return;
        const group = action.payload;
        // A node/group may only belong to one group: detach from any other.
        board.groups.forEach((g) => {
          if (g.id === group.id) return;
          g.childNodeIds = g.childNodeIds.filter(
            (id) => !group.childNodeIds.includes(id),
          );
          g.childGroupIds = g.childGroupIds.filter(
            (id) => !group.childGroupIds.includes(id),
          );
        });
        board.groups.push(group);
      },
      prepare: (input: {
        x: number;
        y: number;
        w: number;
        h: number;
        childNodeIds: string[];
        childGroupIds: string[];
      }) => ({ payload: { id: nanoid(), status: "idle" as const, ...input } }),
    },
    moveGroup: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>,
    ) => {
      const board = activeBoard(state);
      if (!board) return;
      const group = board.groups.find((g) => g.id === action.payload.id);
      if (!group) return;
      const dx = action.payload.x - group.x;
      const dy = action.payload.y - group.y;
      const nodeIds = new Set<string>();
      const groupIds = new Set<string>();
      collectDescendants(board.groups, group.id, nodeIds, groupIds);
      group.x = action.payload.x;
      group.y = action.payload.y;
      groupIds.forEach((id) => {
        const g = board.groups.find((s) => s.id === id);
        if (g) {
          g.x += dx;
          g.y += dy;
        }
      });
      nodeIds.forEach((id) => {
        const n = board.nodes.find((s) => s.id === id);
        if (n) {
          n.x += dx;
          n.y += dy;
        }
      });
    },
    setGroupBounds: (
      state,
      action: PayloadAction<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      // Resize/reposition a group in place — does NOT move its children
      // (used to auto-fit the box around members as they are dragged).
      const board = activeBoard(state);
      if (!board) return;
      const group = board.groups.find((g) => g.id === action.payload.id);
      if (group) {
        group.x = action.payload.x;
        group.y = action.payload.y;
        group.w = action.payload.w;
        group.h = action.payload.h;
      }
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      if (!board) return;
      const id = action.payload;
      // Dissolve the group only — its children become free again.
      board.groups = board.groups.filter((g) => g.id !== id);
      board.groups.forEach((g) => {
        g.childGroupIds = g.childGroupIds.filter((cid) => cid !== id);
      });
      board.connectors = board.connectors.filter(
        (c) => c.sourceId !== id && c.targetId !== id,
      );
    },
    addConnector: {
      reducer: (state, action: PayloadAction<WorkflowConnector>) => {
        const board = activeBoard(state);
        if (!board) return;
        const c = action.payload;
        if (c.sourceId === c.targetId) return; // no self-links
        // A group cannot connect to its own inner nodes/groups (either direction).
        const srcIsGroup = board.groups.some((g) => g.id === c.sourceId);
        const tgtIsGroup = board.groups.some((g) => g.id === c.targetId);
        if (srcIsGroup && isDescendant(board.groups, c.sourceId, c.targetId))
          return;
        if (tgtIsGroup && isDescendant(board.groups, c.targetId, c.sourceId))
          return;
        const duplicate = board.connectors.some(
          (e) =>
            e.sourceId === c.sourceId &&
            e.sourcePort === c.sourcePort &&
            e.targetId === c.targetId &&
            e.targetPort === c.targetPort,
        );
        if (duplicate) return;
        board.connectors.push(c);
      },
      prepare: (input: {
        sourceId: string;
        sourcePort: Port;
        targetId: string;
        targetPort: Port;
      }) => ({ payload: { id: nanoid(), ...input } }),
    },
    removeConnector: (state, action: PayloadAction<string>) => {
      const board = activeBoard(state);
      if (!board) return;
      board.connectors = board.connectors.filter(
        (c) => c.id !== action.payload,
      );
    },
    setScale: (state, action: PayloadAction<number>) => {
      const board = activeBoard(state);
      if (!board) return;
      board.scale = clampScale(action.payload);
    },
    zoomIn: (state) => {
      const board = activeBoard(state);
      if (!board) return;
      board.scale = clampScale(board.scale + SCALE_STEP);
    },
    zoomOut: (state) => {
      const board = activeBoard(state);
      if (!board) return;
      board.scale = clampScale(board.scale - SCALE_STEP);
    },
    resetZoom: (state) => {
      const board = activeBoard(state);
      if (!board) return;
      board.scale = 1;
    },

    // ─── Workflow management ────────────────────────────────────────────────
    addWorkflow: {
      reducer: (state, action: PayloadAction<Workflow>) => {
        state.workflows.forEach((w) => (w.isDisplayed = false));
        state.workflows.push(action.payload);
      },
      prepare: (title?: string) => ({ payload: makeWorkflow(title ?? "Unnamed") }),
    },
    duplicateWorkflow: (state, action: PayloadAction<string>) => {
      const source = state.workflows.find((w) => w.id === action.payload);
      if (!source) return;
      // Board ids are scoped to a board, so a deep clone keeping them is fine.
      const copy: Workflow = {
        id: nanoid(),
        title: `${source.title} copy`,
        createdAt: new Date().toISOString(),
        isDisplayed: true,
        workflowBoard: JSON.parse(JSON.stringify(source.workflowBoard)),
      };
      state.workflows.forEach((w) => (w.isDisplayed = false));
      state.workflows.push(copy);
    },
    displayWorkflow: (state, action: PayloadAction<string>) => {
      state.workflows.forEach((w) => {
        w.isDisplayed = w.id === action.payload;
      });
    },
    renameWorkflow: (
      state,
      action: PayloadAction<{ id: string; title: string }>,
    ) => {
      const workflow = state.workflows.find((w) => w.id === action.payload.id);
      if (workflow) {
        workflow.title = action.payload.title;
      }
    },
    removeWorkflow: (state, action: PayloadAction<string>) => {
      const removed = state.workflows.find((w) => w.id === action.payload);
      state.workflows = state.workflows.filter((w) => w.id !== action.payload);
      // Keep exactly one displayed workflow.
      if (state.workflows.length === 0) {
        state.workflows.push(makeWorkflow("Unnamed"));
        return;
      }
      if (removed?.isDisplayed) {
        const newest = state.workflows.reduce((a, b) =>
          a.createdAt >= b.createdAt ? a : b,
        );
        state.workflows.forEach((w) => {
          w.isDisplayed = w.id === newest.id;
        });
      }
    },
  },
});

export const {
  addNode,
  moveNode,
  removeNode,
  duplicateNode,
  setTask,
  setNodeStatus,
  setGroupStatus,
  addGroup,
  moveGroup,
  setGroupBounds,
  removeGroup,
  addConnector,
  removeConnector,
  setScale,
  zoomIn,
  zoomOut,
  resetZoom,
  addWorkflow,
  duplicateWorkflow,
  displayWorkflow,
  renameWorkflow,
  removeWorkflow,
} = workflowSlice.actions;
export const workflowReducer = workflowSlice.reducer;

// ─── Selectors ────────────────────────────────────────────────────────────
/** Stable empty board so the canvas selector never returns a fresh object. */
const EMPTY_BOARD: WorkflowBoard = emptyBoard();

export const selectWorkflows = (state: RootState) => state.workflow.workflows;

export const selectActiveWorkflow = (state: RootState): Workflow | undefined =>
  state.workflow.workflows.find((w) => w.isDisplayed);

export const selectActiveBoard = (state: RootState): WorkflowBoard =>
  selectActiveWorkflow(state)?.workflowBoard ?? EMPTY_BOARD;
