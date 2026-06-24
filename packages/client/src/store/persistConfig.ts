import storage from "redux-persist/lib/storage"; // localStorage for web

export const PERSIST_WHITELIST: string[] = [
  // Add slice key names here to persist them across reloads, e.g. 'auth'
  "theme",
];

export const persistConfig = {
  key: "root",
  storage,
  whitelist: PERSIST_WHITELIST,
};
