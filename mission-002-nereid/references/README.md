# NEREID — Reference library

> Mission 002 · 100 Missions
> Use alongside [../art-direction.md](../art-direction.md) and [../design.md](../design.md).

## 01 / How to collect references

Search on [Cosmos](https://www.cosmos.so/) and [Pinterest](https://www.pinterest.com/). Collect 6–10 outstanding images or short motion references, not dozens of unrelated images. Choose for a specific visual property, not merely because the subject is space. The search phrases below are discovery prompts, not a claim that specific results have been reviewed.

| Category | Search keywords | What to study |
| --- | --- | --- |
| World / atmosphere | `Europa subglacial ocean concept art`; `alien ocean cinematic`; `underwater ice cavern volumetric light` | Scale, darkness, light direction, ice–water boundary |
| Cinematography | `deep sea cinematic still`; `Interstellar Miller planet ocean cinematography`; `underwater science fiction cinematography` | Framing, silhouettes, depth, emotional pacing |
| Generative visuals | `point cloud ocean generative art`; `GPU particle fluid simulation`; `generative topographic landscape`; `scientific visualization particle field` | Density, coherent flow, abstraction, negative space |
| Material and light | `glacial ice abstract macro photography`; `underwater caustics dark`; `bioluminescence long exposure photography` | Translucency, selective illumination, light falloff |
| Type and layout | `experimental editorial typography poster`; `Swiss modernist science poster`; `space expedition graphic identity`; `oversized typography cinematic web design` | Type scale, hierarchy, asymmetry, alignment |
| Scientific graphics | `bathymetry sonar point cloud`; `multibeam sonar visualization`; `scientific expedition graphic design`; `minimal scientific interface` | Functional markings, mapping, data reveal |
| Interactive experience | `immersive WebGL website`; `Awwwards experimental WebGL hero`; `interactive science exhibition digital experience` | Scene transitions, UI integration, deliberate motion |

**Start with these five searches:** `Europa subglacial ocean concept art`, `point cloud ocean generative art`, `underwater ice cavern volumetric light`, `experimental editorial typography poster`, and `bathymetry sonar point cloud`.

## 02 / Named inspiration — borrow the principle

| Reference | Borrow | Do not borrow |
| --- | --- | --- |
| *Interstellar* (2014), Miller's planet sequence | Immensity, sparse composition, the tension of scale | Film frames, plot, recognizable imagery or branding |
| *Subnautica* | Underwater depth, layered environments, light in darkness | Game HUD, identifiable creatures, colorful reef aesthetics |
| Real deep-sea expedition imagery | Authentic lighting, suspended particles, contrast of probe and environment | Unrelated Earth wildlife as supposed Europa life |
| Swiss / experimental editorial design | Grid discipline, large type, typographic contrast | A literal poster layout that fails on the web |
| Bathymetric and sonar imagery | A meaningful reveal of hidden structure, coherent data aesthetics | Random numbers or fabricated data presented as real science |

## 03 / Grounded scientific sources

These NASA sources support the premise of an ocean beneath Europa's icy crust. They do not establish the appearance of that ocean or the existence of extraterrestrial life.

- [Europa facts](https://science.nasa.gov/jupiter/jupiter-moons/europa/europa-facts/)
- [Evidence for an ocean](https://science.nasa.gov/mission/europa-clipper/why-europa-evidence-for-an-ocean/)
- [Europa's mysterious interior — artist's concept](https://science.nasa.gov/earth/oceans/europas-mysterious-interior-artists-concept/)
- [Europa Clipper FAQ](https://science.nasa.gov/mission/europa-clipper/mission-faq/)

Use these for plausibility and the visual logic of ice, ocean and rocky interior. NEREID is a separate fictional expedition, not the real Europa Clipper mission. Check image-specific usage terms and credits before publishing assets.

## 04 / vgpu technical references

- [vgpu examples gallery](https://vgpu.sh/examples) — visual exploration and Copy Prompt.
- [Particles ocean](https://vgpu.sh/examples/fft-ocean) — primary technical foundation; FFT-driven water displacement with particles and bloom.
- [Particles ocean fullscreen preview](https://vgpu.sh/preview/fft-ocean) — inspect motion, density and visual scale.
- [Particles ocean source](https://vgpu.sh/examples/fft-ocean/source.md) — coding agent reference.
- [Official GitHub repository](https://github.com/vercel-labs/vgpu) — agent setup, package information and implementation.

In the gallery, also explore **FFT ocean surface**, **Interactive Fluid**, **Atmosphere & Clouds**, **Raymarched fractal**, **Glass Fractal**, **Particle Orbit**, and **Adaptive Quality**. These are candidates for individual techniques; do not assume their pipelines can be combined unchanged or that every example is needed. Claude should assess compatibility and cost before integrating.

The Particles ocean page documents this source retrieval command (run in an appropriate working folder; avoid overwriting existing work):

```sh
npx vgpu examples pull fft-ocean --out ./fft-ocean
```

The technical source is a starting point, not a visual target.

## 05 / Curated images

Images live in this folder. One primary reference per design property. Each row says what to borrow, so the image never becomes a template. Third-party images (`.jpg`) are gitignored: they stay local and are never shipped or published.

| File | Source | Property | What to borrow |
| --- | --- | --- | --- |
| `00-vgpu-particles-ocean-baseline.png` | Our own render of the unmodified vgpu Particles ocean, Chrome + WebGPU, 1440×900 | Technical baseline | Proof the foundation renders. 262,144 points read as a surface only where light catches the crests; the upper third carries all the detail. |
| `01-atmosphere-under-ice.jpg` | Cosmos (sea ice from below; photographer unknown) | Ice–ocean boundary | **Take:** the ceiling as a rippling band of light, a translucent slab glowing from within, darkness owning the lower half. **Leave:** sunlight from above. Under 20 km of ice there is no sun, so on NEREID every light comes from the fracture. |
| `02-light-shafts.jpg` | Cosmos (underwater sun rays; photographer unknown) | Light shafts | **Take:** shafts that fan from one source and fall off into blue-black; a few glints in the beams. **Leave:** the overexposed warm sunburst. Ours are thin, cold (`#C8EEF0`), diagonal from the fracture, and few. |
| `03-suspended-matter.jpg` | Discover Wildlife, marine snow footage | Foreground particles | **Take:** wide size variation, soft out-of-focus discs near camera, sharp specks far away, teal cast. **Leave:** the uniform, busy density. Ours is sparse, foreground-only and mostly dim. |
| `04-particle-form.jpg` | Behance, "Unit" | Point-cloud form, light | **The closest match to our medium.** **Take:** one raking light that picks out a single mound of points while everything else falls to black; silhouettes made only of points; huge negative space. **Leave:** the starfield, which reads as open sky. |
| `05-editorial-type.jpg` | *Interstellar* teaser poster (Warner Bros./Paramount), reference only | Typography, scale | **Take:** wide-tracked serif capitals; tiny type held inside a vast image; the image does the talking. **Leave:** the centred poster layout and any film identity. |
| `06-sonar-swath.jpg` | Undercurrent, "Mapping the seafloor one ping at a time" (World Oceans Day prototype) | Sonar graphics | **Take:** data exists only where the ping reached: a revealed strip of terrain on black, ridges readable through shading. **Leave:** the rainbow colour scale. Ours is a single ramp from mineral blue to ice light, with amber only for the one simulated reading. |
| `07-fracture-crevasse.jpg` | User download, Alaska glacier crevasse (photographer unknown) | The fracture | **Take:** the fracture as a very narrow, jagged, over-bright core; light grazing the scalloped edges right beside it and falling off fast into deep blue. **Leave:** the walls and the snow floor. Our fracture is a rift through the sonar returns, not a corridor. |
| `08-type-alien.jpg` | TeePublic pin design (fan artwork based on the *Alien*, 1979, title sequence), reference only | Character-by-character formation | **Take:** each letter of A L I E N is a column of fragments that grows more complete and brighter toward the baseline; the columns start at different heights, so letters finish at different moments; bold geometric sans caps, very wide tracking, tiny credit below. For the NEREID wordmark in Bodoni Moda, build each glyph from partial slices (a masked strip that widens per step) and stagger the start per letter. **Leave:** the geometric sans, the grey ramp as decoration, and the vertical "ghost trail" layout. Ours forms in place, one transient per letter, not a printed history. Context: in the 1979 film the title letters appear one fragment at a time over a slow pan across the planet. |
| `09-type-interstellar.jpg` | *Interstellar* teaser poster with the light streak (Warner Bros./Paramount), reference only; a different poster from `05` | Light-driven reveal | **Take:** one line of wide-tracked serif caps across a black frame; a band of particulate light enters from the right with a hard curved front, and where it passes the letters flip from white-on-black to black-on-light. Small caps above left and below right hang off the title's edges. For NEREID, a headline whose contrast is set by the light passing behind it, so the light writes the word. **Leave:** the bright white streak and its comet shape, and the billing block. Our light is thin and cold, from the fracture. |
| `10-type-arrival.jpg` | *Arrival* theatrical poster (Paramount), reference only | Restraint, type against an object | **Take:** a single small line, "WHY ARE THEY HERE?", widely tracked caps, set straight across the dark shell and running out into the sky; one huge dark form owns the frame; the title at the foot in thin, glowing, extremely wide-spaced capitals; a boxed coordinate pair (46.533772, -106.670380) in the corner, a real instrument detail. For NEREID, one plain question set over the darkest mass on screen, and coordinates as a quiet Plex Mono stamp. **Leave:** the daylight palette, helicopter and landscape, and the thin sans title. This poster shows no logograms; the circular script is film context, not in this image. |
| `11-graphics-voyager-golden-record.jpg` | *How It Works* magazine infographic of the Voyager Golden Record cover (NASA artwork, 1977) | Scientific diagrams, annotation | **Take:** single-weight line drawings that explain themselves without words: the record and stylus seen from above, the tick-mark binary notation, the scan waveforms, the pulsar map (14 lines radiating from one point, with a long reference line) and the two-state hydrogen atom joined by a line. Thin leader lines connect each drawing to a numbered note. For NEREID, render the transmission as diagrams drawn in thin points or lines, with Plex Mono notes on leaders. **Leave:** the gold metal texture, the heavy black magazine headline and the long paragraphs. Never present these as NASA material or imply the expedition is real. |
| `12-motion.*` | To add | Camera timing through a boundary | |

### Typography and graphics references → chapters

- **`08` Alien letter formation → The Opening.** The NEREID title assembling from fragments, one letter at a time, sets up a story about signals resolving out of noise.
- **`09` Interstellar light reveal → The Fracture (and Arrival).** The fracture is the only light source, so a headline that reads only where that light passes ties the type to the environment.
- **`10` Arrival restraint → First Contact and The Anomaly.** One quiet question over the largest dark form fits the moment the probe meets something it cannot yet name; the coordinate stamp fits the anomaly readout.
- **`11` Voyager diagrams → The Discovery and The Transmission.** Engraved, self-explaining diagrams suit the evidence being recorded and then sent home as a message.

## 06 / Instructions to Claude

Analyze each supplied reference separately: subject, composition, focal point, scale, typography, contrast, color, texture, material, lighting, motion and interaction. State what to borrow, what to reject and how to reinterpret it for NEREID.

Resolve contradictions across references into one coherent direction. If the references indicate a more compelling composition than the initial design, propose it and explain the reason. Do not copy layouts, identifiable artwork or default library styling. Use reference images to inform original procedural graphics and art direction, not as substitutes for the main WebGPU visual.
