// Builds ONE mission into site/mission-NNN/ (committed to git). Run it when a mission ships or changes:
//   npm run build:mission -- <number>      e.g. npm run build:mission -- 2
// Vercel never builds missions. It only copies site/ (see build-site.mjs), so deploys stay fast
// however many missions exist, and one broken mission can't block the others.
//
// Each mission picks its own stack. It's built by the first option that matches
// (see "Build contract" in .claude/skills/ship-mission/SKILL.md):
//   1. package.json has a "build:site" script -> run it with MISSION_BASE and MISSION_OUT set
//   2. a Vite project                         -> tsc -b (if tsconfig.json) + vite build --base
//   3. no package.json                        -> copy the static files as-is
import { execSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const pnpm = process.env.PNPM_CMD ?? "npx --yes pnpm@10.28.0"
const VITE_CONFIGS = ["vite.config.ts", "vite.config.js", "vite.config.mjs", "vite.config.mts"]

const run = (cmd, cwd, env = {}) => {
  console.log(`\n$ ${cmd}   (in ${cwd.replace(root, ".") || "."})`)
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } })
}

const number = Number(process.argv[2])
if (!Number.isInteger(number)) {
  console.error("Usage: npm run build:mission -- <number>")
  process.exit(1)
}

const { missions } = JSON.parse(readFileSync(join(root, "missions.json"), "utf8"))
const m = missions.find((x) => x.number === number)
if (!m) {
  console.error(`Mission ${number} isn't in missions.json yet. Add its entry first (see the ship-mission skill).`)
  process.exit(1)
}

const dir = join(root, m.dir)
const dest = join(root, "site", m.slug)
if (!existsSync(dir)) throw new Error(`${m.slug}: folder ${m.dir} not found`)

console.log(`=== Building ${m.slug}: ${m.title} -> site/${m.slug}/ ===`)
rmSync(dest, { recursive: true, force: true })
mkdirSync(dirname(dest), { recursive: true })

const pkgPath = join(dir, "package.json")
if (!existsSync(pkgPath)) {
  const src = join(root, m.static ?? m.dir)
  if (!existsSync(join(src, "index.html"))) throw new Error(`${m.slug}: no package.json and no index.html in ${src}`)
  // Never publish the mission's working files (instructions, brief, references).
  const skip = /[\\/](node_modules|\.git|\.claude|references|docs|CLAUDE\.md|brief\.md|art-direction\.md|README\.md)([\\/]|$)/
  cpSync(src, dest, { recursive: true, filter: (p) => p === src || !skip.test(p.slice(src.length)) })
} else {
  run(`${pnpm} install --frozen-lockfile`, dir)
  const { scripts = {} } = JSON.parse(readFileSync(pkgPath, "utf8"))
  if (scripts["build:site"]) {
    run(`${pnpm} run build:site`, dir, { MISSION_BASE: `/${m.slug}/`, MISSION_OUT: dest })
  } else if (VITE_CONFIGS.some((f) => existsSync(join(dir, f)))) {
    if (existsSync(join(dir, "tsconfig.json"))) run(`${pnpm} exec tsc -b`, dir)
    run(`${pnpm} exec vite build --base=/${m.slug}/ --outDir "${dest}" --emptyOutDir`, dir)
  } else {
    throw new Error(`${m.slug}: add a "build:site" script to ${m.dir}/package.json (see the ship-mission skill, Build contract)`)
  }
}

if (!existsSync(join(dest, "index.html"))) throw new Error(`${m.slug}: build finished but site/${m.slug}/ has no index.html`)
console.log(`\nBuilt site/${m.slug}/. Commit it with the mission.`)
