---
name: library-discovery
description: Process for choosing a mission's stack, renderer, component kit or libraries: check the platform and learnings.md, find candidates, evaluate, spike, record the decision. Use before adding a dependency or picking a stack.
---

# Library and component discovery

How to choose a stack, renderer, component kit or library for a mission. Each mission picks fresh. Exploring different tools is part of the challenge, so the right choice is the one that best serves *this* mission's idea, not the one used last time.

## The process

### 1. Name the need precisely
Write what you need in terms of behaviour, not a library name: "physically thrown cards that collide and stack", "a 2D pixel canvas that stays crisp at any size", "accessible toggle controls styled as arcade buttons".

### 2. Check what the platform already does
Modern browsers handle a lot without dependencies: CSS animation, container queries, `:has()`, view transitions, scroll-driven animations, `<dialog>`, Popover API, Web Audio, Canvas 2D, WebGL/WebGPU, Web Animations API, Intl. Use these when they're enough.

### 3. Check the root `learnings.md`
Earlier missions may already have tested something useful. Reuse a learning, not a mission's code.

### 4. Search for candidates
- Use current sources: official docs, GitHub, npm and the library's changelog. **Don't rely on memory** for versions or APIs. They change. Use the web and docs tools available in the session to check.
- Look for 2–4 candidates, including at least one less obvious option. A mission is a good excuse to try something new.

### 5. Evaluate

| Criterion | Questions |
|---|---|
| **Fit** | Does it do the core need well, or would we fight it? |
| **Health** | Recent releases? Issues answered? Works with the current versions of the rest of our stack? |
| **Weight** | Bundle size and runtime cost. Can it be tree-shaken or lazy-loaded? |
| **Accessibility** | Does it handle keyboard, focus and ARIA, or do we have to add them? |
| **Styling freedom** | Can it be fully restyled to match the art direction, or does it impose a look? |
| **Licence** | Is it permissive (MIT, Apache, BSD, OFL for fonts)? Note it for the README credits |
| **Types & DX** | TypeScript types, clear docs, good errors |

### 6. Spike before committing
For anything central (renderer, motion engine, physics), build a 20–30 minute throwaway spike of the hardest part. Decide from the spike, not the marketing page.

### 7. Record the decision
In the mission's `CLAUDE.md` under "Decisions", write one line per choice: what, why, and what you rejected. When the mission ships, add anything reusable to `learnings.md`.

## Component kits

Copy-in kits (shadcn-style registries such as shadcn/ui, 8bitcn and other community registries) give you the code to own and restyle, which suits a one-off creative project. Installed design systems are faster but harder to make look distinctive. Headless primitives (Radix, React Aria, Ark UI, Base UI) give accessible behaviour with no imposed look, often the best base for a strong custom style.

## Map of territory to explore

Starting points, not a required list. Verify each is current before use.

- **Frameworks / build:** Vite with React, Svelte, Vue, Solid or vanilla; Astro for content-heavy pages; plain HTML/CSS/JS for small missions.
- **Motion:** CSS, Web Animations API, Motion, GSAP, anime.js, auto-animate, react-spring.
- **2D rendering:** Canvas 2D, SVG, PixiJS, p5.js, Paper.js, Two.js, Konva.
- **3D / shaders:** Three.js, React Three Fiber and drei, Babylon.js, OGL, TSL / WebGPU, raw GLSL.
- **Physics:** Matter.js, Rapier, cannon-es, Planck.
- **Illustrated animation:** Rive, Lottie, sprite sheets.
- **Audio:** Web Audio API, Tone.js, Howler.js.
- **Generative / noise:** simplex-noise, d3-random, custom shaders.
- **Data viz:** D3, Observable Plot, visx, ECharts.
- **Text effects:** Splitting.js, custom span splitting, variable fonts, SVG text paths.
- **Fonts:** Fontsource (self-hosted npm packages), Google Fonts, foundry trials (check the licence).

## Red flags

- The library's last release was years ago and it hasn't been confirmed to work with current versions of its peers.
- It needs a global stylesheet that fights the art direction.
- It pulls a huge dependency tree for one small feature.
- The demo looks great but the hard part of *our* need isn't covered.
