# Mission 002: NEREID

Instructions for working on this mission. They add to the root `CLAUDE.md` and override it on anything creative (style, stack, interactions). The root engineering standards still apply.

## Read first

1. [brief.md](brief.md): what we're making and why.
2. [art-direction.md](art-direction.md): how it looks, moves and feels. Sections 01–08 are the user's direction (04b, the type system, overrides 04); 09 is the build decisions.
3. [design.md](design.md): the user's content, composition, states and acceptance criteria. It supersedes the brief's copy.
4. [copy.md](copy.md): the user's expedition copy (2026-11-24). It supersedes design.md's copy.
5. [sound-design.md](sound-design.md): the user's sound direction.
6. [references/README.md](references/README.md): when making visual decisions.

## Status

- **Phase:** Quality pass (v4: polish after the user's review of v3) <!-- Brief → Art direction → Discovery → Build → Quality pass → Shipped -->
- **Next step:** The user reviews v4 (see Current state).

Only work on the phase the user asks for.

## Current state (2026-11-24, v4: polish round)

The user asked for a final, showable version: no lag, human scroll pacing, gradual changes in speed, and fixes to the type. Done and verified:

- **Fonts:** Bodoni now loads its `opsz` (display) files; before, it used the text cut. The tagline is Plex Sans. Bodoni is for the title and headlines only.
- **NEREID** forms from horizontal slices of light again (the user's favourite), now smooth: no stepping, and the mask is dropped once a letter is whole.
- **Arrival** uses a focus pull instead of animated tracking, so the lines never re-wrap. Condense letters settle close to their place instead of scattering.
- **Pacing:** see storyboard.md "Pacing". Measured with a motion profile; there is no dead stretch, the approach zooms in place, the dive is slow, the shaft speeds up and slows down, and the rewind is a clean dissolve.
- **Opening:** Jupiter (lit, at SUN×60) → Europa; the title clears the moon at 1280, 1440 and 1920 (camera at distance 12, aim −2.8). The intro clock waits for fonts (at most 2.5 s).
- **Audit applied:** the sonar reveal only grows; no layout reads in the frame loop (gauge, splits and rects are measured at boot, on resize (debounced) and when fonts load); `gpu.lost` → fallback; debounced graph rebuilds; chapter links and the skip link land on a formed frame and move focus; faded frames are `inert`; focus returns to #begin after replay; sr-only text instead of `aria-label` on `<p>`; queued announcements; WGSL `sq()` instead of `pow(x, 2.0)`; the diagram is a fixed 400 px scaled by transform, and the outer ring is excluded from the draw-on; custom properties are written only on change; the renderer import runs in parallel with the adapter request; Arrival and Fracture have a text-side shade for AA contrast.
- **Measured:** paced scroll at 2× DPR: 0 frames over 50 ms, max 16.8 ms, tier stays medium (before: 12 frames over 50 ms and a drop to low). tsc, 20 tests and `vite build --base=/mission-002/` pass. Reduced motion and the no-WebGPU fallback were checked; the stills were regenerated.
- **Round 2 (same day):** headlines and the closing question at weight 600 (more presence); "or scroll" in Plex Sans beside the CTA; modes that move whole lines or words no longer split letters (letter boxes broke Bodoni's kerning, e.g. "dow n"). **The sonar is scroll-driven** (`SWEEP` and `sweepRadius` in story.ts): the ring spreads as the visitor scrolls from the end of First Contact into The Anomaly, holds when they stop, and gathers back on the way up, then one small settle ripple; there's one ping per dive and no timed re-pings. **Sound** per the user's sound-design.md: `src/sound.ts` (procedural Web Audio; buses → limiter; world beds crossfaded from the director's weights; traversal texture from the spring's velocity; ten cues on real events, with hysteresis) and a dev-only audition panel (`?audition`, not in builds). Levels were measured offline against the doc's dBFS targets; nobody has listened yet. **`QualityGovernor`** steps down a tier only if that actually helps; under Chrome's battery 30 fps cap it restores the tier.
- **Round 3:** the user found the NEREID reveal "sped up" and not immersive. The title now forms over 3.8 s of the intro clock (`TITLE` in main.ts: about 2.2 s per letter, staggered), with the tagline after it and the narrative and CTA last. Scrolling or keys early only hurry the Jupiter travel (3×, was 5× for everything); the title is never sped up. The camera spring is OMEGA 5.5 (was 7): a little more weight, settling in about 0.85 s. The `.cta` buttons are engraved Golden Record gold (brushed plate, lit gold frame, one glint on hover or focus; label contrast 10.8:1), from the user's Voyager record reference.
- **Round 4, the copy (copy.md):** the chapters are now The Mystery, Arrival, The Descent, First Contact, The Anomaly, The Discovery and The Transmission. NEREID still forms first; the mystery question is the Opening tagline.
  - Status lines (Plex Mono, typed out) and actions carry `data-window="a,b[,c,d]"` (chapter progress), so they land on the visual event: landing site at P 1.52, liquid water just before the breakthrough, samples at the vents. First Contact's text waits for the breakthrough.
  - The action buttons (`.cta[data-go]`) glide the scroll to the next discovery over 1.6–4.5 s, so the sonar sweep and the signal play out; any wheel, touch or key cancels the glide.
  - The Transmission signal now leaves at P 6.45–6.75 (after "Transmit findings"). Europa holds the right of the frame (the top on portrait) through the pull-back.
- **Round 5 (committed as 41dc97e, then this interim sound change):** the user found the procedural sound "very bad", not cinematic, not cohesive, and the noise layers during the zoom "like disturbance". Every noise layer (ambience beds, traversal hiss, ice ticks) was removed; `src/sound.ts` now plays only short tonal cues on the key events (levels measured: UI about −22, key moments −19 to −12 dBFS). The dev audition panel was removed. Sound is **on by default** as a remembered preference (`localStorage` "nereid-sound"); audio starts at the first click, tap or key press, since browsers allow nothing earlier.
- **Next (start in a fresh session; this one ran very long):**
  1. **Narrative as callouts, not a text column.** The user: the headline animation is good, but the paragraph text animation is bad, and a stacked column on one side is hard to read ("people won't read everything"). Replace each chapter's `.narrative` paragraphs with one or two short callouts pinned to things in the scene. Each callout has a thin engraved leader line, Golden Record style: hairline, gold or ice, a small tick or circle at the target end. It appears in sequence (the line draws, then the words), using the existing anchor projection (`projectSpace` / `ocean.project`) and `data-window` timing. Callouts are not plain fades; give each a soft cue when it lands. Targets:
     - Opening: Europa ("Scientists believe there is a vast ocean beneath this frozen moon…").
     - Arrival: the ice, then the reddish crack (`DIVE_POINT`).
     - Descent: the probe's lamp at the shaft centre.
     - First Contact: the probe lights and the dark water.
     - Anomaly: the warm region (`ANOMALY`).
     - Discovery: the vent (`VENT`).
     - Transmission: Europa, then Earth (`EARTH_DIR`).
     Keep the headline, status lines and CTAs as they are. Copy stays as in copy.md, split into callout-sized lines without changing words. Check AA contrast over the scene. On phones, callouts stack under their marker. Keep an accessible text order (sr-only copy of each chapter).
  2. **Real sound, not synthesis.** The limitation: Claude can't hear, so procedural sound was designed blind. Use generated or recorded assets the user can audition:
     - ElevenLabs sound effects. The claude.ai ElevenLabs connector must be authorised first; it was unavailable in this session.
     - Or public-domain NASA audio.
     - Or CC0 clips (record licences in README).
     Needed: a space bed, an ice-descent bed, an ocean bed, the breakthrough, a sonar ping with returns, the anomaly lock, a vent warmth swell, the transmission pulses, UI confirms. Load lazily after the first gesture, crossfade beds from the director's world weights, keep the sound-design.md mixing targets, and let the user audition before integrating.
  3. Then shipping to Vercel (ship-mission skill: README, missions.json, build into site/, commit, push as perlasoumyasri), only once the user confirms.

## Skills

- `.claude/skills/vgpu/`: the official vgpu agent skill (`npx skills add vercel-labs/vgpu`, pinned in `skills-lock.json`). It routes to the docs bundled with the installed package: `./node_modules/.bin/vgpu docs find <topic>`.

## Stack

- **Framework / rendering:** Vite + TypeScript, no UI framework. WebGPU through vgpu.
- **Key libraries:** `vgpu` 0.6 (runtime), `@vgpu/wgsl` (Vite loader for `.wgsl` imports), Fontsource (Bodoni Moda variable with optical size, IBM Plex Sans, IBM Plex Mono).
- **Package manager:** pnpm (`npx --yes pnpm@10.28.0` if pnpm isn't installed).
- **Build for the site:** Vite default (`tsc -b` + `vite build --base=/mission-002/`). Public assets use relative paths.

## Commands

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm test       # vitest: camera, story, director, quality tiers
pnpm build
```

## Structure

```
index.html              seven <section> chapters (scroll spacers) with fixed frames, chapter gauge nav, anchors, fineprint
storyboard.md           the seven-chapter storyboard, motion grammar and feasibility plan (read before changing the story)
src/main.ts             scroll → story → director → renderer and the DOM overlay (kinetic type, anchors, gauge, diagram)
src/lib/story.ts        the expedition clock: spring-smoothed story position P (0..7) and the sonar logic (tested)
src/lib/director.ts     P + time → cameras, world weights, sun, flashes, depth (pure, tested)
src/lib/camera.ts       ocean camera matrices and projection (tested against the original example's camera)
src/lib/quality.ts      quality tiers, the frame-budget watcher and the governor that detects frame-rate caps (tested)
src/type/kinetic.ts     per-chapter kinetic type: slices, focus, lamp, condense, sonar, rise, transmit
src/sound.ts            the procedural sound engine (sound-design.md); src/audition.ts is the dev-only audition panel
sound-design.md         the user's sound direction
src/ocean/world.wgsl    space (stars, Jupiter, Europa, lineae, the dive, the signal) and the ice shaft
src/ocean/plume.wgsl    the vent field: chimney points and a stateless rising plume
src/ocean/*.wgsl        the vgpu fft-ocean pass graph (simulation and bloom unchanged; particles and present modified)
src/ocean/renderer.ts   one graph: world (own lower-res target) → blit + ocean particles + plume → bloom → present
public/stills/          seven stills rendered from the live scenes, loaded only when WebGPU is unavailable
```

## Decisions

- **vgpu fft-ocean as the base (required by the brief).** The pulled example (`vgpu examples pull fft-ocean`) matched the repo source byte for byte. It was first run unmodified in Chrome to confirm it renders (`references/00-vgpu-particles-ocean-baseline.png`), then that copy was deleted.
- **Vanilla TS instead of React.** One hero with one canvas, so a framework adds weight and no value. Rejected: React (the example's wrapper) and Three.js (vgpu already is the renderer).
- **The original camera replaced by a free yaw/pitch camera.** A unit test proves it reproduces the original view matrix at the surface pose.
- **Descent driven by two cascaded exponential smoothers** rather than a tween. Velocity stays continuous, and a reset mid-move just reverses. Rejected: eased tweens, which jump in velocity when interrupted.
- **Sonar physics as the source of all scan visuals.** 1 world unit = 50 m, so the ring travels at a true 1,500 m/s. The range readout, contours and annotation reveal all derive from the ring radius.
- **Adaptive quality scales the scene and bloom targets, not the canvas.** The surface DPR is fixed at creation in vgpu 0.6, so tiers cap the scene's DPR, scale its render size and, on the lowest tier, draw every second particle per axis (per-call `instances`). Tiers only ever step down, which avoids oscillation.
- **Fallback is a still of our own render**, not stock imagery, and the interface still runs.
- **Performance (after user feedback: lag on an M1 MacBook Air at 2×):** profiling showed the FFT simulation and the half-resolution bloom each cost about half a frame. Medium and low run the simulation every second frame and start bloom at quarter resolution. Retina screens start on medium. The frame watcher reacts within about 1.5 s and counts slow frames instead of ignoring them. The choreography clamps dt at 0.1 s per frame (the spring integrates in 1/120 s substeps).
- **Immediate response:** the pulse fires on the click, not on arrival (it used to wait about 3 s, and far longer at low frame rates).
- **Scroll = descend:** there is one scene, so wheel, swipe and arrow keys move through it (down descends, up returns), one move per gesture.
- **Fonts (v1):** Cormorant Garamond for the headline, Archivo for the wordmark, IBM Plex Mono for instrument text. All OFL via Fontsource. Superseded by the 2026-11-24 type system below; not yet rebuilt.
- **Adopted the user's art direction, references and design spec (2026-11-24)** as the source of truth. My first art direction (an open-sea point cloud) is folded in as the rendering language: a spectral reconstruction.
- **v2 (rift, foreground drift, design.md copy, Plex type, early headline) was built and then rejected by the user, and reverted in full.** Reasons given: the drift and the glowing line read as meaningless, the colours felt worse, and the extra motion felt unnecessary. Lesson: on this mission, the sonar wave is the whole idea. New visual layers dilute it.
- **The return mirrors the descent:** on ascent, the ring starts wide (150 units) and gathers into the probe over 1.8 s, then releases one small ripple (40 units). The descent is faster (two-stage smoothing, τ = 0.5 s, about 3 s), and the copy fades were shortened.
- **No animation library.** The motion lives in shaders and one state machine; GSAP or Motion would only feed the same numbers. Theatre.js is the one candidate, if the camera path ever needs hand-keyed tuning.
- **Type system (2026-11-24): Bodoni Moda, IBM Plex Sans, IBM Plex Mono**, from the user's typography direction (art-direction 04b). Bodoni Moda (variable: `opsz` 6–96, `wght` 400–900, italics; import `opsz.css` and `opsz-italic.css`) sets the mission title and chapter headlines. Plex Sans carries narrative and controls; Plex Mono carries annotations and telemetry. Supersedes Cormorant Garamond and Archivo. Scale and `clamp()` values are in design.md 04. All OFL via Fontsource. Installed.

- **v3, the seven-chapter expedition (2026-11-24, user direction):** one renderer, three worlds (space, ice shaft, the existing ocean) blended by a pure director from a spring-smoothed story position. Every world change hides behind a physical event (dive, breakthrough, rewind). Studied the Event Horizon benchmark first; kept its principles (one subject, escalating reveals, a progress gauge, ending on a question), not its look. See storyboard.md.
- **No new libraries for v3.** GSAP, Theatre.js and Lenis were each rejected: the director already owns every number, and native scroll keeps keyboard and assistive-tech behaviour.
- **Space world at reduced resolution, by tier** (0.75/0.6/0.5 of the scene). The Europa close-ups cost about 18 noise evaluations per pixel; at full scene resolution they ran at 47 fps on the M1 at 2×, and at 60 fps rendered smaller and upscaled. The limb is anti-aliased analytically so the upscale doesn't stair-step.
- **Lineae are anisotropic ridged noise** (stretched domains in three orientations). Isotropic ridged noise read as a brain texture.
- **The sonar sweep is scroll-driven (user, 2026-11-24):** the ring radius is a function of story position (P 3.92 → 4.8), not of time, so it plays as the visitor scrolls closer, holds when they stop, and reverses on the way up. The headline is revealed by a mask that follows the ring's projected radius.
- **Fallback = seven stills of our own scenes,** loaded only when WebGPU is missing.
- **Pacing is measured, not guessed (v4):** a motion profile (screen change per 100 px of scroll across P 0–7) found a dead Opening, an Arrival compressed into a third of its chapter, and a dive 30–40× faster than the baseline. The beats now live in `BEATS` in director.ts.
- **No flash on the rewind:** any flash adds linear ice colour, which reads as grey fog over the dark space world.

## Mission-specific rules

- Cyan (`#8be3f5`) only marks the active instrument (pulse, contours, focus). Warm (`#f1d3a1`) only marks the thermal anomaly. The two CTA buttons (#begin, #replay) are engraved Golden Record gold (label `#e3b866`, highlight `#f7dc98`, edge `#7a5420`, plate `#140e07`), the user's direction from the Voyager record reference (2026-11-24).
- Every visual effect must come from the simulation or the pulse. No decorative particles.
- Never use NASA logos or branding. Keep the unofficial notice visible at every size.
- Type: no Orbitron, gaming or "futuristic" display fonts. No neon glow, text-shadow bloom or gradient-filled headlines. Uppercase only for the title and short instrument labels.
- No repeated fade-up scroll reveals, and no two chapters with the same heading layout. Each chapter's type moves with what its environment is doing: the camera, the light, the sonar, the discovery.
