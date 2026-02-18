import type { SDKLogger } from "../types/index.js";

/** Silent logger — drops everything. */
export const noopLogger: SDKLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

/** Simple console logger — useful for development. */
export const consoleLogger: SDKLogger = {
  debug: (msg, meta) => console.debug(`[wearable-sdk] ${msg}`, meta ?? ""),
  info: (msg, meta) => console.info(`[wearable-sdk] ${msg}`, meta ?? ""),
  warn: (msg, meta) => console.warn(`[wearable-sdk] ${msg}`, meta ?? ""),
  error: (msg, meta) => console.error(`[wearable-sdk] ${msg}`, meta ?? ""),
};
