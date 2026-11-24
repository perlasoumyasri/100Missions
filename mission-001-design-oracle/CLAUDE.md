# Mission 001: The Fortune Machine

Instructions for working on this mission. They add to the root `CLAUDE.md` and override it on anything creative. The root engineering standards still apply.

**Status: shipped** (2026-11-23), live at https://100-missions.vercel.app/mission-001/. Treat it as finished. Only change it when the user asks, and keep the existing behaviour working.

## Read first

1. [brief.md](brief.md): what it is and why.
2. [art-direction.md](art-direction.md): the VHS 8-bit railway-machine direction.
3. [README.md](README.md): the full public write-up, including the file map.

`brief.md` and `art-direction.md` were written after shipping, from the README and the code. If they disagree with the code, the code is right.

## Stack

- **Framework / rendering:** React 19, TypeScript, Vite. The machine and Tikku are SVG pixel geometry.
- **Key libraries:** Tailwind CSS v4, 8bitcn components (copied into `src/components/ui/8bit/`), Radix primitives, sonner (toasts), `@fontsource/vt323`.
- **Audio:** Web Audio API, all sounds synthesised in `src/lib/sound.ts`.
- **Package manager:** pnpm (lockfile committed).
- **Build for the site:** the Vite default in `scripts/build-mission.mjs` (`tsc -b` + `vite build --base=/mission-001/`), output committed in `site/mission-001/`. Rebuild with `npm run build:mission -- 1` after any code change.

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm lint       # oxlint
pnpm test       # shuffle-bag unit tests (node --test)
```

## Structure

See "Where things are" in [README.md](README.md). The key files are `src/App.tsx` (the coin → wheel → printer → ticket choreography), `src/lib/art/` (machine and Tikku sprites), `src/lib/pixel/` (pixel toolkit and font), `src/data/fortunes.ts` (81 fortunes).

## Decisions

- 8bitcn for the controls, custom SVG pixel art for the machine: the kit gave accessible, themed controls, and the hero art needed to be original.
- 8bitcn VHS theme (dark): matched the nostalgic, slightly glitchy railway-machine concept.
- SVG pixel geometry rather than canvas or images: crisp at any size, and each part can be animated separately.
- Synthesised sound rather than audio files: no assets to load, and it's easy to tune to the motion.
- V1 "The Design Oracle" (a quote generator for designers) was reworked into V2 "The Fortune Machine" for everyone.

## Mission-specific rules

- Pixel art must stay crisp: the machine size snaps to whole device pixels. Don't introduce non-integer scaling.
- Every font is VT323. Colours come from the VHS theme values in `art-direction.md`.
- Fortunes are original and never attributed to real people. Keep the 3 topics × 3 tones × 9 structure.
- Reduced motion shows the ticket instantly. Keep that path working.
