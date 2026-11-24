// Assembles the deployable site into ./dist. This is what Vercel runs. It builds nothing:
//   /                -> the mission board (hub/)
//   /mission-NNN/    -> copied from site/mission-NNN/, built once by build-mission.mjs when it shipped
// Missions not listed in missions.json are never copied, so they stay locked on the hub.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, extname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "dist")
const { total, missions } = JSON.parse(readFileSync(join(root, "missions.json"), "utf8"))

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, "thumbs"), { recursive: true })

const published = []
for (const m of missions) {
  const built = join(root, "site", m.slug)
  if (!existsSync(join(built, "index.html"))) {
    throw new Error(`${m.slug} isn't built. Run: npm run build:mission -- ${m.number}  (then commit site/${m.slug}/)`)
  }
  cpSync(built, join(out, m.slug), { recursive: true })

  let thumb = null
  if (m.thumbnail && existsSync(join(root, m.thumbnail))) {
    thumb = `thumbs/${m.slug}${extname(m.thumbnail)}`
    cpSync(join(root, m.thumbnail), join(out, thumb))
  }
  published.push({ number: m.number, slug: m.slug, title: m.title, tagline: m.tagline, date: m.date, tags: m.tags ?? [], thumb })
}

cpSync(join(root, "hub"), out, { recursive: true })
writeFileSync(join(out, "missions.json"), JSON.stringify({ total, missions: published }, null, 2))
console.log(`Site assembled: ${published.length}/${total} missions -> dist/`)
