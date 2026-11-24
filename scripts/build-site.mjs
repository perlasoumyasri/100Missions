// Builds the whole site into ./dist:
//   /                -> the mission board (hub/)
//   /mission-XXX/    -> each mission, built from its own folder with its own dependencies
// Missions not listed in missions.json are never built or uploaded, so they stay locked.
//
// Each mission picks its own stack. A mission is built by the first option that matches
// (see "Build contract" in .claude/skills/ship-mission/SKILL.md):
//   1. package.json has a "build:site" script -> run it with MISSION_BASE and MISSION_OUT set
//   2. a Vite project                         -> tsc -b (if tsconfig.json) + vite build --base
//   3. no package.json                        -> copy the static folder as-is
import { execSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "dist")
const pnpm = process.env.PNPM_CMD ?? "npx --yes pnpm@10.28.0"
const run = (cmd, cwd, env = {}) => {
  console.log(`\n$ ${cmd}   (in ${cwd.replace(root, ".") || "."})`)
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } })
}

const VITE_CONFIGS = ["vite.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.mts"]

function buildMission(m, dir, dest) {
  const pkgPath = join(dir, "package.json")

  if (!existsSync(pkgPath)) {
    const src = join(root, m.static ?? m.dir)
    if (!existsSync(join(src, "index.html"))) throw new Error(`${m.slug}: no package.json and no index.html in ${src}`)
    console.log(`\n(static) copying ${src.replace(root, ".")}`)
    // Never publish the mission's working files (instructions, brief, references).
    const skip = /[\\/](node_modules|\.git|references|docs|CLAUDE\.md|brief\.md|art-direction\.md|README\.md)([\\/]|$)/
    cpSync(src, dest, { recursive: true, filter: (p) => p === src || !skip.test(p.slice(src.length)) })
    return
  }

  run(`${pnpm} install --frozen-lockfile`, dir)
  const { scripts = {} } = JSON.parse(readFileSync(pkgPath, "utf8"))

  if (scripts["build:site"]) {
    run(`${pnpm} run build:site`, dir, { MISSION_BASE: `/${m.slug}/`, MISSION_OUT: dest })
  } else if (VITE_CONFIGS.some((f) => existsSync(join(dir, f)))) {
    if (existsSync(join(dir, "tsconfig.json"))) run(`${pnpm} exec tsc -b`, dir)
    run(`${pnpm} exec vite build --base=/${m.slug}/ --outDir "${dest}" --emptyOutDir`, dir)
  } else {
    throw new Error(`${m.slug}: add a "build:site" script to ${m.dir}/package.json (see .claude/skills/ship-mission/SKILL.md, Build contract)`)
  }

  if (!existsSync(join(dest, "index.html"))) throw new Error(`${m.slug}: build finished but ${dest} has no index.html`)
}

const { total, missions } = JSON.parse(readFileSync(join(root, "missions.json"), "utf8"))

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, "thumbs"), { recursive: true })

const published = []
for (const m of missions) {
  const dir = join(root, m.dir)
  if (!existsSync(dir)) throw new Error(`${m.slug}: folder ${m.dir} not found`)
  console.log(`\n=== Building ${m.slug}: ${m.title} ===`)
  buildMission(m, dir, join(out, m.slug))

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
