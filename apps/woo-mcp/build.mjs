import { build } from "esbuild"
await build({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node22",
  outfile: "dist/server.js",
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" },
})
