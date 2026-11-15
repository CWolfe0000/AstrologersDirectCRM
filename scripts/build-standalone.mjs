/**
 * Builds the whole prototype into ONE self-contained HTML page (plus the
 * marketing screenshots) so it can be viewed without a Node server, e.g. as a
 * claude.ai Artifact.  Output: dist-standalone/index.html + screenshots/.
 *
 *   node scripts/build-standalone.mjs
 */
import { build } from "esbuild";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const out = path.join(root, "dist-standalone");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, "screenshots"), { recursive: true });

// 1. CSS via Tailwind (fonts come from Google Fonts in the page head)
const cssIn = path.join(out, "in.css");
fs.writeFileSync(cssIn, fs.readFileSync(path.join(root, "app/globals.css"), "utf8"));
execSync(`npx tailwindcss -c tailwind.config.ts -i ${cssIn} -o ${path.join(out, "app.css")} --minify`, { cwd: root, stdio: "inherit" });
const css = fs.readFileSync(path.join(out, "app.css"), "utf8");

// 2. JS bundle with Next.js modules replaced by small client-side shims
const rewriteAssets = {
  name: "rewrite-assets",
  setup(b) {
    b.onLoad({ filter: /\/(app|components)\/.*\.tsx?$/ }, async (args) => {
      const src = await fs.promises.readFile(args.path, "utf8");
      return { contents: src.replaceAll('"/screenshots/', '"screenshots/'), loader: args.path.endsWith("x") ? "tsx" : "ts" };
    });
  },
};
const result = await build({
  entryPoints: [path.join(root, "standalone/entry.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_DATA_MODE": '"demo"' },
  alias: { "next/link": path.join(root, "standalone/shims/link.tsx"), "next/navigation": path.join(root, "standalone/shims/navigation.ts") },
  loader: { ".css": "empty" },
  plugins: [rewriteAssets],
  logLevel: "warning",
});
const js = result.outputFiles[0].text.replaceAll("</script", "<\\/script");

// 3. Page (the artifact host adds the doctype/head/body skeleton)
const html = `<title>AstrologersDirect Prototype</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500;600;700&display=swap">
<style>${css}
:root{color-scheme:light}
body{background:#F7F5F1;color:#29272B;font-family:"Inter Variable",Inter,system-ui,sans-serif}
</style>
<div id="root"></div>
<script>${js}</script>
`;
fs.writeFileSync(path.join(out, "index.html"), html);
for (const f of fs.readdirSync(path.join(root, "public/screenshots"))) fs.copyFileSync(path.join(root, "public/screenshots", f), path.join(out, "screenshots", f));
fs.rmSync(cssIn); fs.rmSync(path.join(out, "app.css"));
console.log(`✓ dist-standalone/index.html (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
