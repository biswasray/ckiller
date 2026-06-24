import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import type { ThemeMode } from "../constants/themes";
import type { AppDispatch, RootState } from "./index";
import { selectTheme, selectThemeMode } from "./index";
import { setTheme, toggleTheme } from "./themeSlice";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useTheme = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const mode = useAppSelector(selectThemeMode);

  return {
    theme,
    mode,
    setTheme: (m: ThemeMode) => dispatch(setTheme(m)),
    toggleTheme: () => dispatch(toggleTheme()),
  };
};
