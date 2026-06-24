import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { SkillGroup } from "../interfaces";
import { skillService } from "../services";

export const fetchSkills = createAsyncThunk("skills/fetchAll", async () => {
  return skillService.getAll();
});

interface SkillsState {
  groups: SkillGroup[];
  loading: boolean;
  error: string | null;
}

const initialState: SkillsState = {
  groups: [],
  loading: false,
  error: null,
};

export const skillsSlice = createSlice({
  name: "skills",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.groups = action.payload;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to load skills";
      });
  },
});

export const skillsReducer = skillsSlice.reducer;
