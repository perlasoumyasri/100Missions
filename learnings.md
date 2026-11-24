# Learnings

Reusable discoveries from each mission: libraries worth knowing, prompting techniques, animation approaches and implementation tricks. This is a knowledge base, not a style guide. A learning tells a future mission what's *possible* and what to watch out for. It never says a future mission *should* look or work this way.

## How to use this file

- **Read** the relevant sections during a mission's discovery and build phases. Search it (e.g. for "audio" or "canvas") rather than reading it top to bottom once it grows.
- **Add** to it when a mission ships, or as soon as something non-obvious is learned. Only add what would help a *different* mission. Mission-specific notes stay in that mission's README.
- **Format:** one entry per learning, under the right section:
  `- **Short title** (Mission NNN): what was learned, why it matters, and where to see it in that mission's code.`
- **Keep it true:** if a later mission finds a learning is wrong or outdated, edit or remove it and note which mission found that out.

## Libraries and tools

- **8bitcn** (Mission 001): a shadcn-style registry of 8-bit React components with themes (VHS, etc.). Components are copied into the project, so they can be fully edited. If the site is unreachable, copy the components from its official GitHub repo; that's what `shadcn add` does anyway. See `mission-001-design-oracle/src/components/ui/8bit/`.
- **Reading theme values from source** (Mission 001): a component library's exact theme tokens are more reliable from its source CSS (8bitcn's `app/retro-globals.css`) than from its website or docs.
- **Fontsource for fonts** (Mission 001): bundling fonts with `@fontsource/*` packages removes the Google Fonts request and avoids layout shift. Remove any `@import` of remote fonts that a copied kit brings with it.

## Prompting and working with Claude

*(No entries yet. Add techniques that produced noticeably better results, e.g. how a brief or reference was phrased, or how a review was set up.)*

## Animation and motion

- **A ritual beats a result** (Mission 001): a random output feels far more special when it's earned through a short physical sequence (coin → wheel → printer → ticket, about two seconds). Use it for key moments, not routine ones.
- **Character comes from reactions, not constant motion** (Mission 001): a sprite that barely moves still feels alive when it reacts to what happens (notices the coin, works a lever, reacts to the result). 13 frames on one base sprite were enough. See `src/lib/art/tikku.ts`.
- **Reduced motion as an instant version** (Mission 001): with `prefers-reduced-motion`, show the end state immediately (the ticket just appears) rather than removing the result.

## Rendering and visual tricks

- **Pixel art needs whole-pixel scaling** (Mission 001): drawing at a non-whole scale leaves faint seams. Snap the art's size to whole *device* pixels (account for `devicePixelRatio`). See the sizing in `src/components/machine/fortune-machine.tsx`.
- **Pixel art as SVG geometry** (Mission 001): drawing pixel art as SVG rects from a small grid toolkit keeps it crisp, scriptable and animatable per part, with no image assets. A tiny 3×5 pixel font covers in-art text. See `src/lib/pixel/`.

## Audio

- **Synthesised Web Audio effects through one master bus** (Mission 001): six original effects made with oscillators and noise, no audio files. One master gain node keeps the volume consistent and makes muting trivial. See `src/lib/sound.ts`.
- **Sound on by default, unlocked on first gesture** (Mission 001): browsers block audio until a click or tap, so create or resume the `AudioContext` on the first interaction. Always provide a visible mute toggle.

## Implementation tricks

- **Shuffle bag for no-repeat randomness** (Mission 001): draw without replacement until the pool runs out, then refill, and never return the same item twice in a row across refills. Feels "more random" to people than true randomness. See `src/lib/shuffle-bag.ts` and its tests.
- **Shareable PNG export via canvas** (Mission 001): re-render the result on an offscreen canvas at a fixed social size (1080×1080) rather than screenshotting the DOM. See `src/lib/export-ticket.ts`.

## Deployment and build

- **One Vercel site for all missions, prebuilt** (Mission 001 + hub): each mission is built once, locally, into a committed `site/mission-NNN/` (`npm run build:mission -- N`). Vercel only copies those folders and the hub, so deploys take seconds at any mission count and one broken mission can't block the rest. Only missions listed in `missions.json` are published, so unfinished ones stay locked on the hub.
