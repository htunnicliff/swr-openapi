import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: [
    "src/index.ts",
    "src/immutable.ts",
    "src/infinite.ts",
    "src/mutate.ts",
    "src/query.ts",
  ],
  format: "esm",
  outDir: "dist",
  dts: true,
  clean: true,
  sourcemap: true,
});
