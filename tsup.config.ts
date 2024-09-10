import { defineConfig } from "tsup";

export default defineConfig({
  entryPoints: [
    "src/immutable.ts",
    "src/infinite.ts",
    "src/mutate.ts",
    "src/query.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  outDir: "dist",
  clean: true,
});
