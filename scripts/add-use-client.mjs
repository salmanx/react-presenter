// esbuild drops bare directive-prologue statements (like "use client")
// as dead code when bundling, and passing it via esbuild's `banner`
// option doesn't survive either. The standard workaround (used by many
// React libraries) is to prepend it to the compiled output after build.
import { readFileSync, writeFileSync } from "node:fs";

const DIRECTIVE = '"use client";\n';
const files = ["dist/react.js", "dist/react.cjs"];

for (const file of files) {
  const contents = readFileSync(file, "utf8");
  if (!contents.startsWith(DIRECTIVE)) {
    writeFileSync(file, DIRECTIVE + contents);
  }
}
