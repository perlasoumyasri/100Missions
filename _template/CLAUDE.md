# Mission {{NUMBER}}: {{TITLE}}

Instructions for working on this mission. They add to the root `CLAUDE.md` and override it on anything creative (style, stack, interactions). The root engineering standards still apply.

## Read first

1. [brief.md](brief.md): what we're making and why.
2. [art-direction.md](art-direction.md): how it looks, moves, sounds and feels.
3. [references/README.md](references/README.md): when making visual decisions.

## Status

- **Phase:** Brief <!-- Brief → Art direction → Discovery → Build → Quality pass → Shipped -->
- **Next step:** Waiting for the user to describe the mission.

Only work on the phase the user asks for.

## Skills

Shared skills in the repo root's `.claude/skills/` load on demand. Skills only this mission needs go in this folder's `.claude/skills/`. List them here.

## Stack

<!-- Filled in during discovery. -->
- **Framework / rendering:**
- **Key libraries:**
- **Package manager:** pnpm
- **Build for the site:** <!-- Vite default, a build:site script, or static. See "Build contract" in the ship-mission skill -->

## Commands

```bash
# filled in once the project exists, e.g.
# pnpm install
# pnpm dev
# pnpm build
```

## Structure

<!-- A short map of where things are, once there's code. -->

## Decisions

<!-- One line per decision: what, why, what was rejected. Newest last. -->

## Mission-specific rules

<!-- Constraints that only apply here, e.g. "all art is drawn on a 64×64 grid", "no external fonts", "must work offline". -->
