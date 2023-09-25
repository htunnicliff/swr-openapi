import { execSync } from "child_process";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  sourcemap: true,
  clean: true,
  format: ["cjs", "esm"],
  async onSuccess() {
    // Generate TypeScript types
    execSync("tsc --emitDeclarationOnly --declaration");
  },
});
