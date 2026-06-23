/**
 * Isomorphic entry point — exports only code that is safe in any environment
 * (Node.js, browser, workers). This is the `default` export condition and the
 * baseline that the platform entries (`index.node.ts`, `index.browser.ts`)
 * re-export and extend.
 */
export * from "./constants";
export * from "./utils";
