import { build } from "esbuild";

await build({
  entryPoints: ["github-action/src/index.ts"],
  outfile: "github-action/dist/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  sourcemap: false,
  legalComments: "none",
  external: ["@sparticuz/chromium", "puppeteer"],
});
