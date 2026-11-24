---
name: ship-mission
description: Steps to ship a finished mission to the 100 Missions site (README, missions.json, root README, learnings.md, building it into site/, commit) and the build contract for non-Vite stacks. Use when a mission is ready to publish, or when setting up how a mission builds.
---

# Ship a mission

Only ship when the user asks. Run the `visual-quality` review first.

## Steps

1. **Mission README** (from `_template/README.md`) is complete: what it is, how to run it, what was learned, credits with licences. Add `docs/preview.png` (16:10 works well on the hub).
2. **`missions.json`** (repo root): add an entry with `number`, `slug` (`mission-NNN`), `dir`, `title`, `tagline`, `date`, `tags`, `thumbnail`. Listing a mission there unlocks it on the hub, so only shipped missions go in.
3. **Root `README.md`:** add a row to the progress table and update the count.
4. **Root `learnings.md`:** add anything reusable this mission taught (libraries, prompting techniques, animation approaches, implementation tricks), in the format at the top of that file.
5. **Mission `CLAUDE.md`:** set the status to shipped with the date and live link.
6. **Build this mission only:** `npm run build:mission -- <number>` writes it to `site/mission-NNN/`. Then `npm run build` (assembles `dist/` in seconds) and spot-check with `npm run preview`. Rebuild with `build:mission` whenever a shipped mission's code changes.
7. **Commit** the mission folder **and** `site/mission-NNN/`, with the message style `Mission NNN: <what changed>`. Push only when the user asks, as `perlasoumyasri` (see Git in the root CLAUDE.md).

## Build contract

Vercel builds nothing. `scripts/build-site.mjs` only copies `hub/` and the committed `site/mission-NNN/` folders into `dist/`. Each mission is built once, locally, by `scripts/build-mission.mjs`, which serves it at `/mission-NNN/` and uses the first option that matches:

- **`build:site` script in the mission's `package.json`:** runs it with `MISSION_BASE=/mission-NNN/` and `MISSION_OUT=<absolute output dir>` in the environment. The script must write a static site to `MISSION_OUT` with asset URLs under `MISSION_BASE`. Use this for any non-Vite stack.
- **Vite project** (has a vite config, no `build:site`): `tsc -b` if there is a `tsconfig.json`, then `vite build --base=/mission-NNN/`.
- **No `package.json`:** plain static files. It copies the folder named by `static` in `missions.json` (or the mission folder itself, minus `CLAUDE.md`, `brief.md`, `art-direction.md`, `README.md`, `.claude/`, `references/` and `docs/`). Use relative asset paths.

Dependencies install with pnpm from the committed lockfile (`pnpm install --frozen-lockfile`), so commit `pnpm-lock.yaml`.
