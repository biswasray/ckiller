# Redux Setup Templates

Complete file contents for each setup type. Adapt imports based on whether
the `Todo` type comes from `interfaces/todo` or is defined inline.

---

## Redux Toolkit (Slice)

### `src/store/todoSlice.ts`
```ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Todo } from '../interfaces/todo'; // or inline if no interfaces/ folder

export const fetchTodos = createAsyncThunk('todos/fetchAll', async () => {
  const response = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!response.ok) throw new Error('Failed to fetch todos');
  return (await response.json()) as Todo[];
});

interface TodoState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  items: [],
  loading: false,
  error: null,
};

export const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const todoReducer = todoSlice.reducer;
```

### `src/store/index.ts`
```ts
import { configureStore } from '@reduxjs/toolkit';
import { todoReducer } from './todoSlice';

export const store = configureStore({
  reducer: {
    todos: todoReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### `src/store/hooks.ts` (TypeScript only)
```ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

## Traditional Redux + Thunk

### `src/store/types/todoTypes.ts`
```ts
export const FETCH_TODOS_REQUEST = 'FETCH_TODOS_REQUEST' as const;
export const FETCH_TODOS_SUCCESS = 'FETCH_TODOS_SUCCESS' as const;
export const FETCH_TODOS_FAILURE = 'FETCH_TODOS_FAILURE' as const;
```

### `src/store/actions/todoActions.ts`
```ts
import { Dispatch } from 'redux';
import { Todo } from '../../interfaces/todo'; // or inline
import {
  FETCH_TODOS_FAILURE,
  FETCH_TODOS_REQUEST,
  FETCH_TODOS_SUCCESS,
} from '../types/todoTypes';

export const fetchTodosRequest = () => ({ type: FETCH_TODOS_REQUEST });
export const fetchTodosSuccess = (todos: Todo[]) => ({ type: FETCH_TODOS_SUCCESS, payload: todos });
export const fetchTodosFailure = (error: string) => ({ type: FETCH_TODOS_FAILURE, payload: error });

export const fetchTodos = () => async (dispatch: Dispatch) => {
  dispatch(fetchTodosRequest());
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');
    if (!response.ok) throw new Error('Failed to fetch todos');
    const todos: Todo[] = await response.json();
    dispatch(fetchTodosSuccess(todos));
  } catch (err) {
    dispatch(fetchTodosFailure(err instanceof Error ? err.message : 'Unknown error'));
  }
};
```

### `src/store/reducers/todoReducer.ts`
```ts
import { Todo } from '../../interfaces/todo'; // or inline
import {
  FETCH_TODOS_FAILURE,
  FETCH_TODOS_REQUEST,
  FETCH_TODOS_SUCCESS,
} from '../types/todoTypes';

interface TodoState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  items: [],
  loading: false,
  error: null,
};

type TodoAction =
  | { type: typeof FETCH_TODOS_REQUEST }
  | { type: typeof FETCH_TODOS_SUCCESS; payload: Todo[] }
  | { type: typeof FETCH_TODOS_FAILURE; payload: string };

export const todoReducer = (state = initialState, action: TodoAction): TodoState => {
  switch (action.type) {
    case FETCH_TODOS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_TODOS_SUCCESS:
      return { ...state, loading: false, items: action.payload };
    case FETCH_TODOS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
```

### `src/store/reducers/index.ts`
```ts
import { combineReducers } from 'redux';
import { todoReducer } from './todoReducer';

export const rootReducer = combineReducers({
  todos: todoReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
```

### `src/store/index.ts`
```ts
import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk'; // redux-thunk v3+; use default import for v2
import { rootReducer } from './reducers';

export const store = createStore(rootReducer, applyMiddleware(thunk));
export type AppDispatch = typeof store.dispatch;
export type { RootState } from './reducers';
```

> **Note on redux-thunk import**: v3+ uses named export `{ thunk }`. v2 and below
> uses default import `import thunk from 'redux-thunk'`. Check the installed version
> and adjust accordingly.

---

## Redux Saga

### `src/store/types/todoTypes.ts`
```ts
export const FETCH_TODOS_REQUEST = 'FETCH_TODOS_REQUEST' as const;
export const FETCH_TODOS_SUCCESS = 'FETCH_TODOS_SUCCESS' as const;
export const FETCH_TODOS_FAILURE = 'FETCH_TODOS_FAILURE' as const;
```

### `src/store/actions/todoActions.ts`
```ts
import { Todo } from '../../interfaces/todo'; // or inline
import {
  FETCH_TODOS_FAILURE,
  FETCH_TODOS_REQUEST,
  FETCH_TODOS_SUCCESS,
} from '../types/todoTypes';

export const fetchTodosRequest = () => ({ type: FETCH_TODOS_REQUEST });
export const fetchTodosSuccess = (todos: Todo[]) => ({ type: FETCH_TODOS_SUCCESS, payload: todos });
export const fetchTodosFailure = (error: string) => ({ type: FETCH_TODOS_FAILURE, payload: error });
```

### `src/store/reducers/todoReducer.ts`
```ts
import { Todo } from '../../interfaces/todo'; // or inline
import {
  FETCH_TODOS_FAILURE,
  FETCH_TODOS_REQUEST,
  FETCH_TODOS_SUCCESS,
} from '../types/todoTypes';

interface TodoState {
  items: Todo[];
  loading: boolean;
  error: string | null;
}

const initialState: TodoState = {
  items: [],
  loading: false,
  error: null,
};

type TodoAction =
  | { type: typeof FETCH_TODOS_REQUEST }
  | { type: typeof FETCH_TODOS_SUCCESS; payload: Todo[] }
  | { type: typeof FETCH_TODOS_FAILURE; payload: string };

export const todoReducer = (state = initialState, action: TodoAction): TodoState => {
  switch (action.type) {
    case FETCH_TODOS_REQUEST:
      return { ...state, loading: true, error: null };
    case FETCH_TODOS_SUCCESS:
      return { ...state, loading: false, items: action.payload };
    case FETCH_TODOS_FAILURE:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};
```

### `src/store/reducers/index.ts`
```ts
import { combineReducers } from 'redux';
import { todoReducer } from './todoReducer';

export const rootReducer = combineReducers({
  todos: todoReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
```

### `src/store/sagas/todoSaga.ts`
```ts
import { call, put, takeLatest } from 'redux-saga/effects';
import { Todo } from '../../interfaces/todo'; // or inline
import { fetchTodosFailure, fetchTodosSuccess } from '../actions/todoActions';
import { FETCH_TODOS_REQUEST } from '../types/todoTypes';

function* fetchTodosWorker() {
  try {
    const response: Response = yield call(fetch, 'https://jsonplaceholder.typicode.com/todos');
    if (!response.ok) throw new Error('Failed to fetch todos');
    const todos: Todo[] = yield call([response, response.json]);
    yield put(fetchTodosSuccess(todos));
  } catch (err) {
    yield put(fetchTodosFailure(err instanceof Error ? err.message : 'Unknown error'));
  }
}

export function* todoWatcher() {
  yield takeLatest(FETCH_TODOS_REQUEST, fetchTodosWorker);
}
```

### `src/store/sagas/index.ts`
```ts
import { all } from 'redux-saga/effects';
import { todoWatcher } from './todoSaga';

export function* rootSaga() {
  yield all([todoWatcher()]);
}
```

### `src/store/index.ts`
```ts
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { rootReducer } from './reducers';
import { rootSaga } from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type { RootState } from './reducers';
```

---

---

## Persistence: Updated `src/store/index.ts`

These replace the non-persist versions above once `redux-persist` is set up.

### Redux Toolkit (slice) — with persist
```ts
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE,
  persistReducer, persistStore,
} from 'redux-persist';
import { persistConfig } from './persistConfig';
import { todoReducer } from './todoSlice';

const rootReducer = combineReducers({
  todos: todoReducer,
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
```

### Traditional Redux + Thunk — with persist
```ts
import { createStore, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk'; // v3+; use default import for v2
import { persistReducer, persistStore } from 'redux-persist';
import { rootReducer } from './reducers';
import { persistConfig } from './persistConfig';

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, applyMiddleware(thunk));
export const persistor = persistStore(store);

export type AppDispatch = typeof store.dispatch;
export type { RootState } from './reducers';
```

### Redux Saga — with persist
```ts
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { persistReducer, persistStore } from 'redux-persist';
import { rootReducer } from './reducers';
import { rootSaga } from './sagas';
import { persistConfig } from './persistConfig';

const sagaMiddleware = createSagaMiddleware();
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, applyMiddleware(sagaMiddleware));
export const persistor = persistStore(store);

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type { RootState } from './reducers';
```

---

## Provider + PersistGate wiring examples

### React Native (App.tsx) — with persist
```tsx
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {/* existing root component */}
      </PersistGate>
    </Provider>
  );
}
```

### React (src/index.tsx) — with persist
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from './App';
import { store, persistor } from './store';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
```

---

## interfaces/todo.ts (when interfaces/ folder exists)
```ts
export interface Todo {
  id: number;
  userId: number;
  title: string;
  completed: boolean;
}
```

Add to `interfaces/index.ts`:
```ts
export * from './todo';
```

