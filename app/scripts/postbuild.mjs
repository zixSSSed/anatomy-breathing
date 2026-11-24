/* После vite build: service worker со списком файлов (работа без интернета) и 404.html для адресов вида /notes на GitHub Pages. */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, copyFileSync } from "node:fs";
import { join, relative, sep, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, "..", "..", "docs");
const TEMPLATE = join(here, "..", "..", "sw.template.js");

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

copyFileSync(join(OUT, "index.html"), join(OUT, "404.html"));

const files = walk(OUT)
  .map((p) => relative(OUT, p).split(sep).join("/"))
  .filter((f) => !["sw.js", ".nojekyll", "404.html"].includes(f) && !f.endsWith(".docx"))
  .sort();
const h = createHash("sha1");
for (const f of files) { h.update(f); h.update(readFileSync(join(OUT, f))); }
const version = h.digest("hex").slice(0, 12);

const atlasSrc = readFileSync(join(here, "..", "src", "generated", "atlas.js"), "utf8");
const external = [...atlasSrc.matchAll(/"thumb":\s*"([^"]+)"/g)].map((m) => m[1]);

const sw = readFileSync(TEMPLATE, "utf8")
  .replace("__VERSION__", version)
  .replace("__CORE__", JSON.stringify(["./", ...files]))
  .replace("__EXTERNAL__", JSON.stringify(external));
writeFileSync(join(OUT, "sw.js"), sw);
console.log(`postbuild: sw.js ${version}, ${files.length} files, ${external.length} external; 404.html ready`);
