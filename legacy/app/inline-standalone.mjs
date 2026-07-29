import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"

const buildDirectory = path.resolve("../output/standalone-build")
const outputFile = path.resolve("../output/vndirect-cxm-prototype.html")
let html = await readFile(path.join(buildDirectory, "index.html"), "utf8")

html = await replaceAsync(html, /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g, async (tag, href) => {
  const css = await readFile(path.join(buildDirectory, href), "utf8")
  return `<style>${css}</style>`
})

const scripts = await Promise.all(
  [...html.matchAll(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(async (match) => {
    const script = await readFile(path.join(buildDirectory, match[1]), "utf8")
    // Prevent strings in the bundle from prematurely closing this inline script.
    return `<script>${script.replace(/<\/script/gi, "<\\/script")}</script>`
  }),
)

html = html.replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/g, "")
html = html.replace("</body>", () => `${scripts.join("\n")}</body>`)

await writeFile(outputFile, html)

async function replaceAsync(source, expression, replacer) {
  const matches = [...source.matchAll(expression)]
  const replacements = await Promise.all(matches.map((match) => replacer(match[0], match[1])))
  return matches.reduceRight((result, match, index) => {
    return `${result.slice(0, match.index)}${replacements[index]}${result.slice(match.index + match[0].length)}`
  }, source)
}
