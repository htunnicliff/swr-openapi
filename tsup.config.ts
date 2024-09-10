import { defineConfig, type Options } from "tsup";

const shared: Options = {
  dts: true,
  clean: true,
};

export default defineConfig([
  {
    entryPoints: [
      "src/index.ts",
      "src/immutable.ts",
      "src/infinite.ts",
      "src/mutate.ts",
      "src/query.ts",
    ],
    format: "cjs",
    outDir: "dist",
    ...shared,
  },
  {
    entryPoints: [
      "src/index.ts",
      "src/immutable.ts",
      "src/infinite.ts",
      "src/mutate.ts",
      "src/query.ts",
    ],
    format: "esm",
    outDir: "dist/esm",
    ...shared,
  },
]);
