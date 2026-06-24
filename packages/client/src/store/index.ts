import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import { themes } from "../constants/themes";
import { persistConfig } from "./persistConfig";
import { loaderReducer } from "./loaderSlice";
import { skillsReducer } from "./skillsSlice";
import { themeReducer } from "./themeSlice";

const rootReducer = combineReducers({
  loader: loaderReducer,
  theme: themeReducer,
  skills: skillsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

export const selectThemeMode = (state: RootState) => state.theme.mode;
export const selectTheme = (state: RootState) => themes[state.theme.mode];
