# NEREID — Art direction

> Mission 002 · 100 Missions · North Star creative build
> Companion files: [references/README.md](references/README.md) and [design.md](design.md).
> Sections 01–08 are the user's direction. 04b (2026-11-24) is the user's typography system and overrides 04. Section 09 records the decisions taken to build it.

## 01 / North Star

**The ocean beyond Earth.** A fictional expedition to the hidden ocean of Europa, Jupiter's icy moon. The visitor should feel like the first human witness to an entirely unfamiliar world.

This is a flagship design-engineering experiment, not a conventional NASA homepage or a vgpu demo with text on top. Pursue exceptional visual ambition. Use engineering to serve the creative vision rather than letting the default library appearance dictate the art direction.

**Creative territory:** cinematic speculative science × contemporary editorial design × immersive generative art.

**Emotional progression:** curiosity → awe → anticipation → discovery. The environment should feel ancient, vast, silent, beautiful and slightly unsettling, but not hostile or horror-themed. Science feels like an invitation to wonder.

## 02 / Visual world

- An immense, dark, physically believable ocean beneath a fractured ice ceiling. Let darkness establish scale, with selective illumination exposing only fragments of the world.
- Use the vgpu particle ocean as a technical foundation, then reinterpret it as a spectral reconstruction of an alien ocean or a transition at the ice–ocean boundary. Do not imply that a conventional open-air sea exists under Europa's ice.
- Build foreground, middle ground and distant layers: drifting suspended matter, a luminous geological or fluid formation, and vast receding darkness. Use parallax, occlusion and perspective to make depth palpable.
- Introduce restrained shafts of cold exploration light, atmospheric scattering, subtle caustic-like patterns and controlled bloom. Light must reveal form rather than wash everything in neon.
- Create one memorable, unmistakable visual motif: **a thin luminous fracture that opens into an immense ocean, then becomes a sonar wave during descent.** Treat it as a recurring narrative device, not a decorative overlay.
- Optional high-ambition explorations: procedural ice geometry, bioluminescence-like abstract signals, or a distant probe silhouette for scale. Any possible life is speculative, never presented as a discovery or scientific fact.

## 03 / Color and materials

A starting palette, not a mandatory constraint. Change it when a stronger coherent visual direction emerges from the references.

| Role | Starting value | Purpose |
| --- | --- | --- |
| Abyss | `#03090E` | Near-black negative space |
| Ocean | `#092B39` | Deep petrol-blue atmosphere |
| Mineral blue | `#287783` | Midtone depth and structure |
| Signal cyan | `#6EC7D5` | Active scan, thin highlights |
| Ice light | `#C8EEF0` | Selectively illuminated forms |
| Editorial white | `#F0F4F0` | Primary typography |

Aim for mostly darkness and subdued cool tones, with small luminous areas. A restrained warm amber signal is optional if it creates a meaningful contrast. Avoid making every element cyan. Keep blacks rich, highlights controlled and intermediate tones visible. Materials should feel mineral, translucent, particulate and fluid; avoid plastic gloss.

## 04 / Typography and graphic identity

> Type choices here are superseded by 04b. The graphic language (wordmark, rules, scale markings, negative space) still applies.

- Oversized, assured editorial headline; precise typesetting, optical alignment and intentional line breaks. Test a distinctive contemporary grotesk or an elegant editorial serif against the environment. Choose one, not both competing at headline scale.
- A quiet sans-serif for descriptions and an optional restrained monospace for actual instrument labels. Use no more than two type families where possible.
- Strong contrast between monumental headline and tiny precise annotations; keep essential small text readable.
- Use an expedition wordmark, thin rules, scale markings and sparse scientific notation as a consistent graphic language. Every annotation should have a reason to exist.
- Deliberate negative space and asymmetric composition. Treat the full viewport as one authored frame, rather than stacking conventional sections.

## 04b / Typography system (supersedes 04 and the type decision in 09)

> Later on 2026-11-24 the user found Bodoni unreadable for chapter headings over the moving scene. It now sets only the name NEREID; headings are Instrument Sans (see the mission CLAUDE.md).

> The user's typography direction, 2026-11-24. The text down to "Avoid" is theirs, lightly formatted. Sizes as CSS `clamp()` values are in [design.md](design.md) 04.

Take inspiration from Interstellar's monumental cinematic typography, Arrival's restraint, Alien's opening title choreography and NASA's scientific information design.

Use the following typography system:

- **Bodoni Moda:** Mission title and emotional chapter headlines.
- **IBM Plex Sans:** Supporting narrative, navigation and interactions.
- **IBM Plex Mono:** Scientific annotations, coordinates, depth readings and mission telemetry.

The typography must communicate two contrasting qualities: the emotional magnitude of human discovery and the precision of scientific exploration.

### Scale and composition

- Mission title: 120–220px on large desktop screens, responsive to viewport width.
- Chapter headlines: 64–112px.
- Supporting narrative: 16–20px.
- Technical annotations: 11–13px.
- Mission title tracking: 0.18–0.28em.
- Chapter headlines: optical kerning and compact line heights.
- Use occasional italic emphasis in chapter headlines.
- Use extreme scale contrast, generous negative space and intentional asymmetric compositions.

### Kinetic typography

Treat typography as part of the cinematic choreography.

Explore character-by-character formation, animated tracking, masked reveals, environmental occlusion, light-driven reveals and particle disintegration.

Each animation must relate to what is happening in that chapter. Synchronize typography with camera movements, lighting changes and scientific discoveries.

Keep narrative text readable while the environment remains continuously alive.

### Avoid

- Generic futuristic fonts such as Orbitron.
- Gaming-style typography.
- Neon glowing headlines.
- Gradient-filled text.
- Repetitive scroll-triggered fade-up animations.
- Excessive uppercase text.
- Identical heading layouts across all chapters.
- Typography that competes with the environment rather than complementing it.

The final experience should feel like the opening titles of a beautifully directed science-fiction film, not a technology company's landing page.

### Fonts available (checked on npm 2026-11-24, not installed)

| Package | Version | Axes / weights | Italic | Licence |
| --- | --- | --- | --- | --- |
| `@fontsource-variable/bodoni-moda` | 5.3.0 | `opsz` 6–96, `wght` 400–900 | Yes, true italic files with the same axes | OFL-1.1 |
| `@fontsource/ibm-plex-sans` | 5.3.0 | Static 100–700 | Yes | OFL-1.1 |
| `@fontsource/ibm-plex-mono` | 5.3.0 | Static 100–700 | Yes | OFL-1.1 |

- A variable Plex Sans also exists: `@fontsource-variable/ibm-plex-sans` 5.3.0 (`wght` 100–700, `wdth` 75–100, italics). Plex Mono has no variable package.
- Bodoni Moda's default import (`index.css`) carries only the `wght` axis, with optical size fixed at its text cut. For optical sizing, import `opsz.css` and `opsz-italic.css` instead. The family name is `'Bodoni Moda Variable'`. With `font-optical-sizing: auto` the browser matches `opsz` to the rendered size.
- `opsz` stops at 96. Above 96px the title and headlines all use the finest display cut, with the thinnest hairlines. Smaller sizes, such as headlines on phones, get sturdier hairlines automatically.
- The lightest weight is 400. There is no Light. A lighter feel comes from the display cut and from size, not from weight.
- Bodoni hairlines are thin. Over a moving particle field they can shimmer or break up. Place headlines in quiet parts of the frame, and never fix this with glow.
- Load only the subsets and Plex weights actually used. Preload the title face so it doesn't shift layout.

### Build notes (ours, not part of the direction above)

- Split-character effects keep the real line in the DOM as one accessible string. The split characters are `aria-hidden` visual layers, so a screen reader hears the line once.
- Reduced motion: every kinetic reveal has a designed still or a short crossfade, ending in the same composed position.
- Wide tracking adds space after the last letter. Offset it (for example a negative end margin equal to the tracking) so the title aligns optically.
- Headlines use `font-kerning: normal` and no added tracking. Wide tracking belongs to the mission title only.

### Validation

The type system is not final until it has been checked on rendered screenshots at 390px, 1280px and 1920px widths, over the live scene in every chapter. Check fit, line breaks, hairline legibility against the moving background, and AA contrast.

## 05 / Motion and feeling

- Ambient movement is slow, layered, continuous and organic; the ocean feels alive without looking like a music visualizer.
- Camera movement expresses exploration and changes in perceived scale, not aimless orbiting.
- The signature event: the visitor initiates descent, crosses a luminous boundary, and sees a sonar pulse reveal previously hidden structures. The UI changes in sync with the environment.
- Use anticipation, easing, depth, and a settling moment. Avoid constant aggressive movement, gratuitous cursor trails, rapid zooms, excessive motion blur and flashy transitions.
- Optional sound should be user-initiated, subtle and muted by default. Never require audio to understand the experience.

## 06 / What it must NOT look like

- A generic SaaS hero: centered marketing text, pill badges, two generic buttons, gradient blob, standard feature cards.
- A stock NASA template: obvious planet cutout on the right, stars behind the text, predictable rocket imagery.
- A default vgpu example with only a headline pasted over it.
- Generic AI aesthetics: purple/cyan neon gradients everywhere, indiscriminate bloom, meaningless glass cards, excessive rounded containers, fake holographic dashboards.
- A video game HUD with random coordinates, spinning reticles, meaningless data, excessive grids or unreadable microtext.
- A fantasy underwater scene with cartoon fish, coral reefs or confirmed alien creatures.
- A busy demo reel where ten different effects compete; visual maximalism should come from depth and craft, not clutter.
- A static poster pretending to be an interactive experience, or a shader so dominant that the mission is illegible.

## 07 / Art-direction review

Judge the still frame first. Is there a strong focal point, a distinct silhouette, an intentional type hierarchy and a sense of scale? Then judge motion: does it deepen the story? Finally judge uniqueness: would a screenshot be identifiable as NEREID without the wordmark?

The references are guidance, not a template. Explore two or three substantially different visual compositions if the first feels generic. Select the strongest and refine its details. Do not reduce visual ambition to satisfy an arbitrary timebox; adapt technical quality to device capabilities without sacrificing the intended composition.

## 08 / Creative boundaries

NEREID is an unofficial, fictional mission inspired by real research about Europa. Do not imply NASA endorsement or that the pictured environment, scan data or life forms are verified. Use a small, readable concept disclaimer. Keep factual claims aligned with the NASA sources in `references/README.md`.

## 09 / Decisions for the build

> **Current state (v3, 2026-11-24): the seven-chapter expedition in [storyboard.md](storyboard.md).** The ocean chapters (First Contact, The Anomaly) keep the user-approved v1 frames and sonar wave exactly. The fracture motif now lives where it makes physical sense: Europa's surface linea that the cryobot dives into, not a glowing line on the ocean. The type follows 04b. The notes below this line record the earlier rounds.


> **Current state (2026-11-24): the approved page is v1, the open-sea point cloud with the sonar wave, plus the brightness and performance fixes.** The user reviewed a v2 that added the fracture rift, foreground drift, design.md copy and a two-family type change. It was rejected: the drift "doesn't make sense", the rift "doesn't make sense", the colours felt worse. v2 was reverted in full. The one change kept from that round: on return, the glow ring gathers back into the centre, then settles. Read the rest of this section as the exploration record, not the current build. Type is now set by 04b (2026-11-24), which replaces both the v1 fonts and the reverted v2 type change.

Where 01–08 leave a choice open, this is what was chosen and why. Update it when the build changes.

### Concept, resolved

**A spectral reconstruction, split by one luminous fracture.** The particles are the probe's sonar returns, not a literal sea, which gives the pulse, contours and annotations a reason to exist. The user approved the v1 page as the base (2026-11-24), so the motif was added without changing its camera or its wave:

1. **Surface / idle:** a thin, jagged rift of ice-light runs through the returns from just ahead of the probe, diagonally away to the far right horizon, opposite the type. It is the frame's focal point, and light rakes across the water beside it (after `07-fracture-crevasse.jpg`: a very bright, narrow core that falls off fast).
2. **Click:** the rift flares (rising in 0.12 s, settling over about a second), and the sonar ring is born at its near end. This is the immediate feedback.
3. **Descent and scan:** the camera follows the ring down. The ring reveals contours and, when it reaches the one warm upwelling, the simulated reading.

**Not built, on purpose:** an ice ceiling and crevasse walls. The camera looks down at the water, so a ceiling would never be in frame, and walls would cover the view the user approved. Light shafts were left out for the same reason.

Concepts considered: (a) the fracture as narrative device (chosen, from 02); (b) an instrument point cloud without ice (the first build: clear, but it reads as an open sea, which 02 rules out); (c) a mission film reel (rejected: turns the world into footage).

### What the references changed

- **Light belongs to the fracture** (01, 02). There is no sun under the ice. The fracture is the only light source in the world: it glows, it throws a few thin cold shafts, and it lights the ceiling's underside in rippling bands. Everything far from it falls to black.
- **One raking light, one lit form** (04). Instead of lighting the whole field evenly, light comes in low from the fracture's side, so one formation (the upwelling) catches it and reads as the focal point. This replaces v1's uniformly lit crests.
- **The scan reveals a swath, not the whole field** (06). Before the pulse the field is dim. Where the ring has passed, structure appears in a single blue-to-ice ramp. Outside its reach stays dark.
- **Wordmark in tracked serif capitals** (05). NEREID is set in Bodoni Moda capitals with wide tracking (0.18–0.28em), not a sans, so the identity and the headlines share one voice. Plex stays for reading text and instrument labels only. (First chosen as Cormorant; superseded by 04b.)
- **Suspended matter has depth of field** (03): large soft discs near the camera, fine specks far away, never evenly spread.

### Layers (02)

- **Foreground:** 520 suspended particles (260 on the low tier) that sink slowly, sway, and wrap around the camera in world space, so they stream past during the descent. Depth of field turns near ones into faint soft discs. Tuned in three passes: large grey discs read as dust on a lens, and invisible ones added nothing. The kept setting has a few soft discs, mostly fine specks, and never competes with the type.
- **Middle:** the vgpu FFT returns, plus the rift and the upwelling.
- **Distance:** receding darkness and the horizon haze.

### Palette (03)

The user's palette is adopted as-is. Two roles are added:

| Role | Value | Rule |
| --- | --- | --- |
| Abyss | `#03090E` | Negative space |
| Ocean | `#092B39` | Atmosphere, haze |
| Mineral blue | `#287783` | Midtones, the returns at rest |
| Signal cyan | `#6EC7D5` | Only for active scan: the ring, contours, focus. Never decoration |
| Ice light | `#C8EEF0` | The fracture, the ice edges, light shafts |
| Editorial white | `#F0F4F0` | Type |
| Thermal amber | `#E8C38E` | Only for the one simulated warm reading. The single warm note |
| Muted label | `#8A9AA3` | Small labels and rules (AA on Abyss) |

Mostly dark, but intermediate tones must stay visible on a dimmed laptop. The first build measured a mean luminance of 13/255 and read as black; the floor is now about 30/255 on the idle frame.

### Typography (04b): Bodoni Moda and IBM Plex

- **Display:** Bodoni Moda (variable, `opsz` and `wght`, with italics) for the mission title and chapter headlines only. The opening tagline is in Plex Sans (user, 2026-11-24). Load the `opsz` files: the default files carry only the text cut, which looked wrong at title size. Italic marks the occasional turn in a line (such as "*beyond*"). A serif still, because the frame is full of hard technical marks and the serif is the human voice against them. Supersedes Cormorant Garamond.
- **Everything else:** IBM Plex. Plex Sans for narrative, navigation and controls; Plex Mono for annotations, coordinates, depth readings and telemetry. One superfamily, so the page reads as two voices: the serif and the instrument. This is why three families don't break 04's "no more than two" rule.
- Archivo (first build) and Cormorant Garamond are removed when the type is rebuilt.
- Sizes and fluid values: design.md 04.

### Motion and animation stack (05)

- **The world:** vgpu on WebGPU. The FFT simulation, the fracture, the pulse and the scan are all shader parameters driven every frame.
- **Choreography:** one state machine (`src/lib/expedition.ts`) owns every beat and drives both the GPU and the DOM, so they cannot drift apart. Moves use two-stage exponential smoothing: they start gently, settle without overshoot and can reverse at any moment. No tween library.
- **Interface:** CSS transitions on opacity, transform and clip-path, keyed off `data-mode` on the body.
- **Pacing:** feedback on the click is immediate (the fracture brightens and the pulse is primed at once); descent about 3 s; sonar sweep about 1.5 s across the visible field; settle about 1 s. A skip is offered during descent. With reduced motion, each state is a crossfade to an art-directed still pose.

### Content (design.md 02)

The copy follows design.md exactly. Telemetry is labelled **Simulated**, values are internally consistent, and the warm reading is described as a possibility, never a discovery.
