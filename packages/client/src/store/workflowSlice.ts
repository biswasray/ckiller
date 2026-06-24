import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";

export interface WorkflowNode {
  id: string;
  skillName: string;
  x: number;
  y: number;
}

interface WorkflowState {
  nodes: WorkflowNode[];
  scale: number;
}

const MIN_SCALE = 0.4;
const MAX_SCALE = 2;
const SCALE_STEP = 0.1;
const DUPLICATE_OFFSET = 24;

const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));

const initialState: WorkflowState = {
  nodes: [],
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
        payload: { id: nanoid(), ...input },
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
      state.nodes = state.nodes.filter((n) => n.id !== action.payload);
    },
    duplicateNode: (state, action: PayloadAction<string>) => {
      const node = state.nodes.find((n) => n.id === action.payload);
      if (node) {
        state.nodes.push({
          id: nanoid(),
          skillName: node.skillName,
          x: node.x + DUPLICATE_OFFSET,
          y: node.y + DUPLICATE_OFFSET,
        });
      }
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
  setScale,
  zoomIn,
  zoomOut,
  resetZoom,
} = workflowSlice.actions;
export const workflowReducer = workflowSlice.reducer;
