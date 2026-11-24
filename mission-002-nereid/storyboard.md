# NEREID: Storyboard, motion direction and feasibility

> One continuous expedition, from orbit to the seafloor and back to Earth. Seven chapters, one camera, one world.
> Reconciles [art-direction.md](art-direction.md), [design.md](design.md) and [references/README.md](references/README.md) with the seven-chapter narrative (2026-11-24).

## What we learned from the benchmark

Event Horizon (studied in Chrome at 1440×900: opening, 22 scroll positions and the footer) feels complete for six reasons. NEREID keeps the principles, not the look.

1. **One subject in every frame.** The black hole is always on screen and grows chapter by chapter. → Europa is always the subject: first as a moon, then as its ice, then as its ocean.
2. **A protagonist for scale.** A spacecraft model sits in the frame. → Our cryobot is a point of warm light whose lamp lights the world around it.
3. **The physics escalates.** Lensing gets stronger each chapter until the camera is inside the disk. → Each chapter goes deeper and reveals one more thing the instruments can see.
4. **The opening withholds.** About 4 s of near-black, then the title forms out of blur. → We withhold too, but form the title from light slices (ref 08).
5. **Progress is always visible.** A segmented bar names the current chapter. → Ours is a depth gauge: the scroll *is* the depth.
6. **It ends with a question, then a quiet footer.** → The Transmission ends on an open question and a replay.

Where it falls short of our direction: Chakra Petch is a generic futuristic face, every chapter uses the same left/right heading block, and the type mostly fades. NEREID's type is Bodoni Moda with IBM Plex, and each chapter gets its own kinetic behaviour.

## The spine

- **Scroll is the expedition clock.** The page is about 8 viewports tall. Scroll position maps to a story position `P` from 0 to 7, one unit per chapter. `P` is smoothed with a critically damped spring, so a jumpy wheel or trackpad still gives one steady camera move.
- **Time keeps the world alive.** Stars, Jupiter's bands, the ice, the ocean swell, the plume and the signal all move on wall-clock time, so nothing freezes when scrolling stops.
- **One renderer, three worlds.** *Space* (Europa, Jupiter, stars), *Ice* (the descent shaft) and *Ocean* (the existing vgpu FFT particle field, plus the vent plume). The director cross-fades between worlds at chapter seams and drives each world's camera from `P`.
- **The sonar wave stays the signature.** The user's favourite moment (the ring spreading through the particles, and gathering back on return) is the centre of chapter 5 and the bridge into chapter 6.

## Storyboard

Each chapter lists the frame (what we see), the camera, the discovery, the emotional shift, the type behaviour and the annotation.

### 1 · The Opening (P 0 → 1): mystery

- **Frame:** black. Stars resolve first. A thin crescent of light grows across Europa as the Sun's terminator sweeps over it; Jupiter's banded limb fills a corner, huge and dim. Europa's lineae (the red-brown cracks) catch the light last.
- **Camera:** still, far out (about 9 Europa radii), with a very slow drift. Scrolling starts a dolly in.
- **Discovery:** a moon of ice, cracked all over.
- **Emotion:** quiet → curiosity.
- **Type:** **NEREID** in Bodoni Moda, 120–220 px, tracking 0.24 em. Each letter forms from horizontal light slices that open one band at a time, staggered per letter (ref 08, Alien). Then *The ocean beyond Earth.* resolves as a single line, set in Plex Sans (user, 2026-11-24: the Bodoni tagline read as generic; Bodoni is for the title and headlines only). The CTA "Initiate descent" scrolls into chapter 2.
- **Annotation (Plex Mono):** `EUROPA · JUPITER II · R 1,561 KM`.

### 2 · Arrival (P 1 → 2): scale

- **Frame:** Europa grows until its surface fills the lower two-thirds. Surface detail sharpens with distance: chaos terrain, double ridges, one long linea crossing the frame diagonally, opposite the type.
- **Camera:** dolly from 9 R to about 1.08 R, then pitch down to skim the surface. The terminator light rakes the ridges.
- **Discovery:** the cracks are ridges kilometres wide. The surface is young: something below keeps renewing it.
- **Emotion:** curiosity → awe at scale.
- **Type:** chapter headline with a **focus pull**: word by word it sharpens from soft focus as the camera closes in. Only opacity, blur and a 6% scale change, so the lines never re-wrap. (Animated tracking was tried and rejected by the user: letters flew in from far apart and the line breaks changed mid-animation.) Narrative in Plex Sans.
- **Annotation:** `ORBIT 3.55 DAYS · SURFACE −160 °C`, with a leader line to the target linea.

### 3 · The Fracture (P 2 → 3): commitment

- **Frame:** the camera dives into the linea. The crack widens to fill the frame, light floods in, and we are inside a blue ice shaft. The cryobot's warm lamp is below us, melting its way down. Ice layers stream upward. The walls glow where the ice is thin.
- **Camera:** dive (P 2.0 → 2.3), then a steady vertical descent (P 2.3 → 3.0).
- **Discovery:** about 20 km of ice (NASA estimates the shell at 15–25 km).
- **Emotion:** awe → tension, pressure.
- **Type:** **light-driven reveal** (ref 09, Interstellar). The headline is masked by a band of light that travels with the cryobot's lamp; letters exist only where the light has passed.
- **Annotation:** a depth counter, 0 → 19,800 m, labelled *simulated*.

### 4 · First Contact (P 3 → 4): release

- **Frame:** breakthrough. A short white-blue flash, then silence and darkness. The ocean particle field emerges from black, enormous, moving on its FFT swell under the ice.
- **Camera:** the original surface pose (the user's approved frame), with a slow settle.
- **Discovery:** liquid water, an ocean with roughly twice the water of Earth's oceans (NASA).
- **Emotion:** tension → release, wonder, a little fear.
- **Type:** **formation from darkness.** Characters condense out of noise: each starts blurred, displaced and dim, and settles at a different moment, like particles finding a surface. One quiet line (ref 10, Arrival restraint).
- **Annotation:** `OCEAN DEPTH (EST.) 60–150 KM`.

### 5 · The Anomaly (P 4 → 5): the signature moment

- **Frame:** the sonar ring leaves the probe and spreads through the particles, lifting them and leaving cyan depth contours behind it (existing, approved). When the ring reaches a warm upwelling, it turns amber.
- **Camera:** the approved descent path from the surface pose to the survey pose.
- **Discovery:** an unexpected thermal reading.
- **Emotion:** wonder → alertness.
- **Type:** **sonar reveal.** The headline is revealed by a radial mask centred on the pulse origin's screen position. Its radius follows the ring, so the words appear as the wave passes them.
- **Annotation:** range readout and the anomaly marker (`ΔT +3.1 K · 4.4 km · simulated`), with coordinates as a stamp (ref 10).

### 6 · The Discovery (P 5 → 6): hope

- **Frame:** the camera glides towards the anomaly. A hydrothermal vent field rises out of the dark: point-cloud chimneys and a warm plume of particles rising and cooling, from amber to grey-cyan. Heat shimmer distorts the water above the vents.
- **Camera:** forward glide, then a slow orbit around the plume.
- **Discovery:** a vent system: heat, chemistry, water. Conditions that *could* support life, never confirmed.
- **Emotion:** alertness → hope, reverence.
- **Type:** **rising formation.** Characters rise into place from below, ordered by their distance from the plume on screen, as if carried up by the warm water.
- **Annotation:** a short simulated readout, with no invented biology: `T +11 °C · CHEMICAL GRADIENT · SIMULATED`.

### 7 · The Transmission (P 6 → 7): the open question

- **Frame:** a fast rewind upward (ocean → shaft → surface → orbit), then stillness. Europa recedes. A thin signal pulse travels across the dark towards a pale blue point: Earth. A line diagram, in the style of the Voyager record's engraving (ref 11), draws itself: Europa at the centre, radiating lines, and tick-mark values for depth, temperature and distance.
- **Camera:** pull back from Europa until it's a small disc, Earth a point.
- **Discovery:** the finding leaves Europa. It takes about 43 minutes to reach Earth (simulated delay).
- **Emotion:** hope → humility, the unanswered question.
- **Type:** a Plex Mono transmission line types out character by character, then the closing question forms in Bodoni italic. On replay, it **disintegrates** into particles that drift up and out.
- **Footer:** replay, credits, the unofficial-concept disclaimer.

## Motion grammar

- **Easing:** springs for the camera (no overshoot), and exponential settles for type. Nothing bounces.
- **Seams:** every world change hides behind a physical event (the dive into the crack, the breakthrough flash, the rewind). No arbitrary fades.
- **Speed:** the camera moves only as fast as the scroll asks. Ambient motion never stops. The type moves on chapter-local progress, so it reverses cleanly when scrolling back up.
- **Reduced motion:** no camera flights. Each chapter shows a still pose; seams are crossfades; type appears without kinetic effects; ambient motion slows right down.

## Feasibility plan

| Element | Technique | Cost / risk | Plan |
|---|---|---|---|
| Stars, Jupiter, Europa | One fullscreen raymarch effect: analytic ray–sphere hits, procedural fbm albedo, ridged-noise lineae, terminator lighting, detail by distance | Medium: noise octaves per pixel. Runs at reduced scene scale on lower tiers | Build first; it's the opening frame |
| Dive into the linea | Same effect: camera targets a crack; crack width and brightness increase with progress | Low | Part of the space effect |
| Ice shaft | Fullscreen effect: polar tunnel mapping with 3D noise walls, subsurface glow, lamp falloff, streaks | Low–medium | Classic demoscene tunnel, art-directed blue |
| Ocean, sonar, scan | Existing vgpu fft-ocean graph (unchanged look) | Known: 60 fps on M1 at medium | Keep exactly |
| Vent plume and chimneys | One instanced draw, stateless particles (position = f(seed, time)), curl-like drift, cooling colour ramp | Low: about 30k points, no compute needed | New WGSL draw |
| Heat shimmer, flash, grade | Present-pass uniforms: screen-space distortion near the vent, flash, vignette, grain | Low | Extend present.wgsl |
| Signal and diagram | Signal pulse in the space effect; the Voyager-style diagram as inline SVG with stroke-dash drawing, labels in Plex Mono | Low; crisp at every size and accessible | SVG overlay |
| Kinetic type | Characters split into spans; the director writes per-character CSS variables only for the active chapter (≤ 60 characters per frame) | Low | Own small module; no GSAP needed |
| Scroll | Native scroll with sticky chapter sections; `P` spring-smoothed in JS | Low; accessible, keyboard and screen-reader friendly | No Lenis: native scroll keeps keyboard and assistive tech behaviour |
| Fallback | Seven stills rendered from our own scenes, swapped per chapter | Low | Generate after the build |

**Libraries:** none added beyond vgpu and fonts. Each considered option was rejected on evidence: GSAP and Theatre.js would only feed the numbers the director already owns, and Lenis would replace native scroll for a smoothing the camera spring already provides.

## Quality bar

- Each chapter's still frame must work as a poster on its own.
- 60 fps on the M1 Air at 2× on the medium tier, measured.
- Type checked on rendered screenshots at 390, 1280 and 1920 widths.
- A recorded clip of the full scroll is reviewed before calling it done.

## Pacing (2026-11-24, after user review)

Measured as on-screen change per 100 px of scroll (scratchpad `profile.mjs`), then tuned so the speed of motion changes gradually:

- **Chapter scroll lengths (vh):** Opening 150, Arrival 170, Fracture 190, First Contact 110, Anomaly 140, Discovery 130, Transmission 150. The ocean chapters keep their lengths (the user likes their pace).
- **Approach (P 0.5 → 2):** starts while the title leaves, so there's no dead stretch. Altitude falls in log space, so the moon grows at an even rate, and the aim offset shrinks with distance, so Europa grows in place instead of sliding across the frame.
- **Dive (P 2 → 2.5):** the slowest moment, by request. The brown surface, the crack and the blue chasm play over half a chapter, and the shaft dissolves in from 2.25 while the frame is still blue.
- **Shaft (P 2.38 → 3):** starts from rest, speeds up, and is still moving but slowing at the breakthrough. The ocean descent leaves at that same speed and settles onto the surface pose.
- **Seams:** the dive flash is soft (0.2), the breakthrough flash is 0.42, and the rewind is a plain dissolve (no flash; even 0.1 read as grey fog). The ocean's bloom threshold arrives as the cube of the ocean weight.
- **Headings:** they hand over with long, overlapping crossfades (out at 0.7–0.99 of a chapter, the next forms from −0.04).
- **Sonar (scroll-driven):** the ring's radius follows scroll from P 3.92 to 4.8 (`sweepRadius`, eased in so the on-screen part gets most of the scroll). It finds the anomaly at about P 4.37. Scrolling back up gathers the glow into the probe.
