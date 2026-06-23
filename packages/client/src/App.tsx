import { APP_NAME, APP_VERSION, greet } from "@ckiller/universe/browser";

export function App() {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>{APP_NAME}</h1>
      <p>{greet("World")}</p>
      <small>v{APP_VERSION}</small>
    </main>
  );
}
