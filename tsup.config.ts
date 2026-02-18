import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: {
      index: "src/index.ts",
      "stores/index": "src/stores/index.ts",
      "providers/garmin/index": "src/providers/garmin/index.ts",
      "providers/fitbit/index": "src/providers/fitbit/index.ts",
    },
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    target: "node18",
    outDir: "dist",
  },
]);
