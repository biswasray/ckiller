import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

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

interface WorkflowState {
  nodes: WorkflowNode[];
  groups: WorkflowGroup[];
  connectors: WorkflowConnector[];
  scale: number;
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

const initialState: WorkflowState = {
  nodes: [],
  groups: [],
  connectors: [],
  scale: 1,
};

export const workflowSlice = createSlice({
  name: "workflow",
  initialState,
  reducers: {
    addNode: {
      reducer: (state, action: PayloadAction<WorkflowNode>) => {
        state.nodes.push(action.payload);
      },
      prepare: (input: { skillName: string; x: number; y: number }) => ({
        payload: { id: nanoid(), status: "idle" as const, ...input },
      }),
    },
    moveNode: (
      state,
      action: PayloadAction<{ id: string; x: number; y: number }>,
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.x = action.payload.x;
        node.y = action.payload.y;
      }
    },
    removeNode: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.nodes = state.nodes.filter((n) => n.id !== id);
      state.connectors = state.connectors.filter(
        (c) => c.sourceId !== id && c.targetId !== id,
      );
      state.groups.forEach((g) => {
        g.childNodeIds = g.childNodeIds.filter((cid) => cid !== id);
      });
    },
    duplicateNode: (state, action: PayloadAction<string>) => {
      const node = state.nodes.find((n) => n.id === action.payload);
      if (node) {
        state.nodes.push({
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
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.task = action.payload.task.trim() || undefined;
      }
    },
    setNodeStatus: (
      state,
      action: PayloadAction<{ id: string; status: WorkflowStatus }>,
    ) => {
      const node = state.nodes.find((n) => n.id === action.payload.id);
      if (node) {
        node.status = action.payload.status;
      }
    },
    setGroupStatus: (
      state,
      action: PayloadAction<{ id: string; status: WorkflowStatus }>,
    ) => {
      const group = state.groups.find((g) => g.id === action.payload.id);
      if (group) {
        group.status = action.payload.status;
      }
    },
    addGroup: {
      reducer: (state, action: PayloadAction<WorkflowGroup>) => {
        const group = action.payload;
        // A node/group may only belong to one group: detach from any other.
        state.groups.forEach((g) => {
          if (g.id === group.id) return;
          g.childNodeIds = g.childNodeIds.filter(
            (id) => !group.childNodeIds.includes(id),
          );
          g.childGroupIds = g.childGroupIds.filter(
            (id) => !group.childGroupIds.includes(id),
          );
        });
        state.groups.push(group);
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
      const group = state.groups.find((g) => g.id === action.payload.id);
      if (!group) return;
      const dx = action.payload.x - group.x;
      const dy = action.payload.y - group.y;
      const nodeIds = new Set<string>();
      const groupIds = new Set<string>();
      collectDescendants(state.groups, group.id, nodeIds, groupIds);
      group.x = action.payload.x;
      group.y = action.payload.y;
      groupIds.forEach((id) => {
        const g = state.groups.find((s) => s.id === id);
        if (g) {
          g.x += dx;
          g.y += dy;
        }
      });
      nodeIds.forEach((id) => {
        const n = state.nodes.find((s) => s.id === id);
        if (n) {
          n.x += dx;
          n.y += dy;
        }
      });
    },
    removeGroup: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      // Dissolve the group only — its children become free again.
      state.groups = state.groups.filter((g) => g.id !== id);
      state.groups.forEach((g) => {
        g.childGroupIds = g.childGroupIds.filter((cid) => cid !== id);
      });
      state.connectors = state.connectors.filter(
        (c) => c.sourceId !== id && c.targetId !== id,
      );
    },
    addConnector: {
      reducer: (state, action: PayloadAction<WorkflowConnector>) => {
        const c = action.payload;
        if (c.sourceId === c.targetId) return; // no self-links
        // A group cannot connect to its own inner nodes/groups (either direction).
        const srcIsGroup = state.groups.some((g) => g.id === c.sourceId);
        const tgtIsGroup = state.groups.some((g) => g.id === c.targetId);
        if (srcIsGroup && isDescendant(state.groups, c.sourceId, c.targetId))
          return;
        if (tgtIsGroup && isDescendant(state.groups, c.targetId, c.sourceId))
          return;
        const duplicate = state.connectors.some(
          (e) =>
            e.sourceId === c.sourceId &&
            e.sourcePort === c.sourcePort &&
            e.targetId === c.targetId &&
            e.targetPort === c.targetPort,
        );
        if (duplicate) return;
        state.connectors.push(c);
      },
      prepare: (input: {
        sourceId: string;
        sourcePort: Port;
        targetId: string;
        targetPort: Port;
      }) => ({ payload: { id: nanoid(), ...input } }),
    },
    removeConnector: (state, action: PayloadAction<string>) => {
      state.connectors = state.connectors.filter(
        (c) => c.id !== action.payload,
      );
    },
    setScale: (state, action: PayloadAction<number>) => {
      state.scale = clampScale(action.payload);
    },
    zoomIn: (state) => {
      state.scale = clampScale(state.scale + SCALE_STEP);
    },
    zoomOut: (state) => {
      state.scale = clampScale(state.scale - SCALE_STEP);
    },
    resetZoom: (state) => {
      state.scale = 1;
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
  removeGroup,
  addConnector,
  removeConnector,
  setScale,
  zoomIn,
  zoomOut,
  resetZoom,
} = workflowSlice.actions;
export const workflowReducer = workflowSlice.reducer;
