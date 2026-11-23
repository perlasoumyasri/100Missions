// Builds the whole site into ./dist:
//   /                -> the mission board (hub/)
//   /mission-XXX/    -> each mission, built from its own folder with its own dependencies
// Missions not listed in missions.json are never built or uploaded, so they stay locked.
import { execSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "dist")
const pnpm = process.env.PNPM_CMD ?? "npx --yes pnpm@10.28.0"
const run = (cmd, cwd) => {
  console.log(`\n$ ${cmd}   (in ${cwd.replace(root, ".") || "."})`)
  execSync(cmd, { cwd, stdio: "inherit" })
}

const { total, missions } = JSON.parse(readFileSync(join(root, "missions.json"), "utf8"))

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, "thumbs"), { recursive: true })

const published = []
for (const m of missions) {
  const dir = join(root, m.dir)
  if (!existsSync(join(dir, "package.json"))) throw new Error(`${m.slug}: no package.json in ${m.dir}`)
  console.log(`\n=== Building ${m.slug}: ${m.title} ===`)
  run(`${pnpm} install --frozen-lockfile`, dir)
  run(`${pnpm} exec tsc -b`, dir)
  run(`${pnpm} exec vite build --base=/${m.slug}/ --outDir ${join(out, m.slug)} --emptyOutDir`, dir)

  let thumb = null
  if (m.thumbnail && existsSync(join(root, m.thumbnail))) {
    thumb = `thumbs/${m.slug}${extname(m.thumbnail)}`
    cpSync(join(root, m.thumbnail), join(out, thumb))
  }
  published.push({ number: m.number, slug: m.slug, title: m.title, tagline: m.tagline, date: m.date, tags: m.tags ?? [], thumb })
}

cpSync(join(root, "hub"), out, { recursive: true })
writeFileSync(join(out, "missions.json"), JSON.stringify({ total, missions: published }, null, 2))
console.log(`\nSite built: ${published.length}/${total} missions unlocked -> dist/`)
