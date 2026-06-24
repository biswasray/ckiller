import { createSlice } from "@reduxjs/toolkit";

interface LoaderState {
  loading: boolean;
}

const initialState: LoaderState = {
  loading: false,
};

export const loaderSlice = createSlice({
  name: "loader",
  initialState,
  reducers: {
    startLoader: (state) => {
      state.loading = true;
    },
    stopLoader: (state) => {
      state.loading = false;
    },
  },
});

export const { startLoader, stopLoader } = loaderSlice.actions;
export const loaderReducer = loaderSlice.reducer;
