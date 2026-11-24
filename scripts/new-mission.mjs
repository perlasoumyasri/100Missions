// Scaffolds a new mission folder from _template/.
//   node scripts/new-mission.mjs <number> <slug> ["Title"]
//   e.g. node scripts/new-mission.mjs 3 paper-planes "Paper Planes"
// Creates mission-NNN-<slug>/ with CLAUDE.md, brief.md, art-direction.md, README.md and references/.
// It doesn't touch missions.json: a mission is only listed there once it ships.
import { cpSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const [numArg, slug, titleArg] = process.argv.slice(2)

const fail = (msg) => {
  console.error(`${msg}\nUsage: node scripts/new-mission.mjs <number> <slug> ["Title"]`)
  process.exit(1)
}

const number = Number(numArg)
if (!Number.isInteger(number) || number < 1 || number > 100) fail("Number must be 1–100.")
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("Slug must be lowercase words joined by hyphens.")

const nnn = String(number).padStart(3, "0")
const existing = readdirSync(root).find((d) => d.startsWith(`mission-${nnn}`))
if (existing) fail(`Mission ${nnn} already exists: ${existing}/`)

const dir = `mission-${nnn}-${slug}`
const title = titleArg ?? slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")
const date = new Date().toISOString().slice(0, 10)
const vars = { NUMBER: nnn, TITLE: title, DATE: date, DIR: dir, SLUG: slug }

const target = join(root, dir)
cpSync(join(root, "_template"), target, { recursive: true })

const fill = (path) => {
  for (const name of readdirSync(path)) {
    const p = join(path, name)
    if (statSync(p).isDirectory()) fill(p)
    else if (name.endsWith(".md")) {
      const text = readFileSync(p, "utf8").replace(/\{\{(\w+)\}\}/g, (m, k) => vars[k] ?? m)
      writeFileSync(p, text)
    }
  }
}
fill(target)

if (!existsSync(join(target, "CLAUDE.md"))) fail("Template copy failed.")
console.log(`Created ${dir}/
Next: fill in brief.md with the user, then art-direction.md. Add it to missions.json only when it ships.`)
