# Mission 002: NEREID

Rules and current facts for this mission. They add to the root `CLAUDE.md` and override it on anything creative (style, stack, interactions); the root engineering standards still apply. History lives in `git log`, not here: when something changes, update the fact in place instead of appending a log entry.

## Read first

1. [brief.md](brief.md): what we're making and why.
2. [art-direction.md](art-direction.md): how it looks, moves and feels. 01–08 are the user's direction (04b, the type system, overrides 04).
3. [copy.md](copy.md): the user's expedition copy. It supersedes the copy in design.md and the brief.
4. [design.md](design.md): composition, states and acceptance criteria.
5. [storyboard.md](storyboard.md): the chapters, beats and measured pacing. Read before changing the story or timing.
6. [sound-design.md](sound-design.md): the user's sound direction.
7. [references/README.md](references/README.md): when making visual decisions.

## Status

- **Phase:** Shipped 2026-11-24, https://100-missions.vercel.app/mission-002/ <!-- Brief → Art direction → Discovery → Build → Quality pass → Shipped -->
- **After shipping:** any code change needs `npm run build:mission -- 2` from the repo root, and the rebuilt `site/mission-002/` committed. The sound defaults were picked blind from measurements; the user may still swap takes at `/audition/` (dev only, git-ignored; regenerate on the ElevenLabs flow "NEREID sound candidates", `i9JbN71N8g0txDbtm4Rs`).
- NEREID title: driven by linear title time (4.6–8.4 s), not an eased clock, so its six letters finish about 0.23 s apart (6.6–7.7 s) and the last ones no longer crawl; each letter keeps its own `t*t*(3-2t)` ease. Random offset per letter is 0.01 of the build.

Only work on the phase the user asks for.

## How it works now

- **Story:** seven chapters: The Mystery, Arrival, The Descent, First Contact, The Anomaly, The Discovery, The Transmission. Scroll position maps to a story position P (0–7) from each section's measured top and height; chapter lengths are `--len` in index.html (150, 170, 190, 230, 260, 230, 220 vh; the ocean chapters were lengthened so their callouts can be read at a steady scroll: about 3 s at 570 px/s, measured). A critically damped spring (OMEGA 5.5, settling in about 0.85 s) smooths P. The beats (approach, dive, ice, shaft, rewind) are `BEATS` in director.ts; the measured pacing is in storyboard.md.
- **Opening:** a time-based intro: Jupiter, "Nearly 800 million kilometres from the Sun." (0.8–4.6 s: a shorter version was too fast to read, so keep this), then Europa, then NEREID forms from slices of light over 3.8 s (`TITLE` in main.ts, 4.6–8.4 s; every letter is whole by 85 % of it). Scrolling moves the opening on only after the name has formed (`lpAtTitle`): before, a scroll brought "The expedition · Europa" in over the journey line. An early scroll or key press only hurries the Jupiter travel; the title is never sped up. The intro clock waits for fonts (at most 2.5 s).
- **Type:** text changes only with the scroll (`kinetic.ts`). NEREID forms from slices of light. Headings come up in place (`fade`: opacity only, no movement, no wipe; the user found the blur, scatter, rising lines and wipes "like a presentation animation"). Instrument lines live in the probe console (below). A no-break space keeps the readings' units together.
- **Narrative:** little text, by the user's request: one short callout per chapter (`.callout` in index.html, layout in `src/type/callouts.ts`). **The words sit in a fixed slot** (`data-slot="x,y,side,up,phoneTop"`: the shelf corner as viewport fractions, which side and direction the words hang, and on phones the top of the words); they never flip or move, and only the leader follows the target. The scroll decides when it begins (its `data-span` start; the Opening's, its clock); from then it builds in time and **comes up whole**: ring, leader and shelf in half a second, then all its words at once (`buildAt` in type/callouts.ts), and it stays until its span ends. Word-by-word reveals (by scroll, then in time) were still arriving when visitors scrolled on, so the user could never read them.ts). In scroll units a trackpad flick showed every word at once, so the user never saw them arrive.ts. The words come up in place (no wipe). It stays until the chapter hands over (span ends at 0.97) and fades with the heading; scrolling back reverses it. If its target leaves the screen, the leader holds its last position. The Opening runs on its own clock after the name (`OPENING` in main.ts, `CLOCK_PACE`, seconds; scrolling moves it on at 6vh a second): the label, the question, the callout's two lines, then Begin expedition, each after the one before has been read (about 17 s in all). **The words keep clear of the chapter's text:** if a slot lands on the heading, label, status line or a narrative line (wide but short windows did this, e.g. 1200×718), `layoutCallout` moves them to the nearest clear spot (right of, above or below that text), measured once per layout so they still never move while showing; a callout that carries over also keeps clear of the next chapter's text. Gold in space, ice in the shaft and the ocean, warm on the anomaly and the vent (whose callouts carry the readings). A dark plate behind the words keeps AA contrast over bright ice. Reduced motion and the no-WebGPU fallback show the callouts static in the text column. The crack's "Landing site" marker was removed (it read as a second callout). The copy follows copy.md ("On the site"): controlled revelation, nothing named before the visitor reaches it, each chapter ending on an open observation.
- **Status lines** (`.status[data-at]` under each heading, `type/status.ts`): the probe's instrument messages, one per chapter, in cyan mono. When the story reaches `data-at` (P) a line types out at a steady teleprinter pace (25 letters/s) with a soft low tick (at most eight a second, filtered, −40 LUFS) and stays until its chapter hands over; arriving from below it is simply there; its space is kept while it waits. By the user's request: a separate console (corner, then top) was "on a different side" and couldn't be read with the rest; lines that faded early were gone before they were read.
- **Synced copy:** the narrative question and actions carry `data-window="a,b[,c,d]"` (chapter progress) so they land on the visual event. The ocean is never announced before the breakthrough. The action buttons (`.cta[data-go]`) glide the scroll over 1.6–4.5 s, and any wheel, touch or key cancels the glide.
- **Sonar:** scroll-driven (`SWEEP` and `sweepRadius` in story.ts). The ring grows as the visitor scrolls into The Anomaly, holds when they stop, and gathers back on the way up. One ping per dive. 1 world unit = 25 m.
- **Sound:** ElevenLabs Sound Effects v3 takes (`public/sound/`, 1.3 MB), loaded only after the first click, tap or key press (usually "Begin expedition"). The opening from Jupiter to Europa is silent, by the user's choice (an entry step asking for sound was tried and rejected). The beds' first start rises from −30 dB to full level over 6 s (`rise`, on the beds only: the click's confirmation plays at once, and loads first). Beds sit at −19 to −17 LUFS (space, ice, ocean) with the motion filter at 4 kHz at rest: at −29 LUFS and 1.8 kHz the user heard nothing on laptop speakers. Measured settled output: about −16 to −25 dBFS RMS before the user asked for it halved (the +6 dB make-up was removed): it sits in the background. Sound is on by default (the user's choice) and is tried at page load: browsers that allow autoplay play from the start; the rest start on the first click, tap or key anywhere (scrolling doesn't count, a gold hint says so). The button shows the preference, "on" or "off". Three looping beds (space, ice, ocean) follow the director's world weights with equal-power crossfades, and all draw back to near-silence just before the breakthrough (`bedGains`). While the camera moves, the beds open (low-pass 4 → 12 kHz, +2 dB) from the spring's speed, settling in about a second (`motion`), so wheel notches never pump the sound. One-shots fire only on the story's events (`POSITION_CUES` in main.ts: landing site, breakthrough, vent, transmission; the sonar and anomaly events; the buttons), each started past its take's silent lead-in (`onsetSeconds`) so the sound lands on the beat; big cues dip the beds 2–4 dB, gently (0.25 s), never a cut. Each take is levelled from its measured LUFS to a per-cue target; a limiter guards the master. The landing-site lock is the anomaly's two tones played a tone lower (the motif). On by default as a remembered preference (`localStorage` "nereid-sound-on"); suspends when the tab is hidden.
- **Quality:** tiers (`quality.ts`) cap the scene's DPR and render scale; the space world renders smaller by tier. `QualityGovernor` steps down only when that actually helps, and restores the tier under a frame-rate cap (Chrome's battery saver holds pages at 30 fps). Last clean measurement (before the Instrument Sans change): a paced scroll at 2× DPR had 0 frames over 50 ms and the tier stayed medium. A later run on a loaded machine dipped, but the committed version measured worse under the same load, so remeasure on an idle machine.
- **Accessibility:** frames that have faded out are `inert`. Chapter links and the skip link land on a formed frame and move focus. Announcements are queued. Text-side shades keep AA contrast over the bright ice. Reduced motion holds a still pose per chapter.

## Stack

- Vite + TypeScript, no UI framework. WebGPU through `vgpu` 0.6 (runtime) and `@vgpu/wgsl` (the `.wgsl` loader).
- Fontsource: Bodoni Moda variable for NEREID (import `opsz.css`, not the default file), Instrument Sans variable for headings (`wdth.css`, `wdth-italic.css`), IBM Plex Sans, IBM Plex Mono. All OFL.
- Use pnpm (`npx --yes pnpm@10.28.0` if pnpm isn't installed). Build with `tsc -b` + `vite build --base=/mission-002/`. Public assets use relative paths.
- Skill: `.claude/skills/vgpu/` (official, pinned in `skills-lock.json`); `./node_modules/.bin/vgpu docs find <topic>`.

```bash
pnpm install
pnpm dev        # http://localhost:5173, opens a Chrome tab
pnpm test       # vitest: camera, story, director, quality, callouts, mix
pnpm build
```

## Structure

```
index.html              seven <section> chapters (scroll spacers) with fixed frames and callouts, gauge nav, fineprint
src/main.ts             scroll → story → director → renderer, and the DOM overlay (kinetic type, callouts, gauge, diagram, sound cues)
src/lib/story.ts        spring-smoothed story position P and the scroll-driven sonar (tested)
src/lib/director.ts     P + time → cameras, world weights, flashes, depth (pure, tested)
src/lib/camera.ts       ocean camera matrices (tested against the original example's camera)
src/lib/quality.ts      tiers, frame-budget watcher, QualityGovernor (tested)
src/type/kinetic.ts     scroll-driven kinetic type: slices (NEREID), fade (headings), transmit (status)
src/type/callouts.ts    callout layout and build stages (tested)
src/sound.ts            audio engine: beds, cues, buses, lazy loading (Web Audio)
src/lib/mix.ts          takes and their loudness, bed crossfade, motion filter, onset detection (pure, tested)
public/sound/           the picked takes, one file per role
audition/               dev-only page and all 44 candidate takes (raw/ = beds before the seam crossfade)
src/ocean/world.wgsl    space (stars, Jupiter, Europa, lineae, the dive, the signal) and the ice shaft
src/ocean/plume.wgsl    the vent field
src/ocean/*.wgsl        the vgpu fft-ocean pass graph (simulation and bloom unchanged; particles and present modified)
src/ocean/renderer.ts   one graph: world (own lower-res target) → blit + particles + plume → bloom → present
public/stills/          seven stills from the live scenes, loaded only without WebGPU
```

## Decisions (still in force)

- **vgpu fft-ocean as the base** (required by the brief); vanilla TS instead of React; a free yaw/pitch camera, unit-tested against the original view.
- **One renderer, three worlds** (space, ice shaft, ocean) blended by a pure director. The dive and the breakthrough hide their seams behind light. The rewind is a plain dissolve: any flash there reads as grey fog.
- **No animation or scroll libraries** (GSAP, Theatre.js and Lenis were rejected): the director owns every number, and native scroll keeps keyboard and assistive-tech behaviour.
- **Pacing is measured, not guessed**, with a motion profile (on-screen change per 100 px of scroll). Speed changes gradually; the dive is the slowest moment, by request.
- **Space world at reduced resolution by tier.** At full resolution the Europa close-ups ran at 47 fps on an M1 at 2×. The limb is anti-aliased analytically.
- **Lineae are anisotropic ridged noise;** isotropic noise read as a brain texture.
- **Fallback = stills of our own scenes,** not stock imagery.

## Rules (from the user's feedback)

- **The sonar wave is the heart of the piece.** Don't add visual layers (drift, decorative lines, colour shifts) without asking: v2 did, and the user rejected it in full.
- **Colour:** cyan (`#8be3f5`) marks the active instrument (pulse, contours, focus). Warm (`#f1d3a1`) marks the thermal anomaly. The CTA buttons are engraved Golden Record gold: label `#e3b866`, highlight `#f7dc98`, edge `#7a5420`, plate `#140e07`.
- **Type:**
  - Bodoni Moda is for the name NEREID only: the user found it unreadable for headings over the moving scene. Headings are Instrument Sans (weight 500, tracking −0.032em, italic for emphasis), chosen in a spike against Schibsted Grotesk, Fraunces and Hanken Grotesk. Everything else is IBM Plex Sans; instrument labels are Plex Mono.
  - No Orbitron or "futuristic" faces, no neon glow, no gradient headlines. Uppercase only for the title and short labels.
  - Headlines never re-wrap mid-animation, letters never move in, and no glyph is ever clipped (the user saw the "g" cut).
- **Text:** keep it minimal. Only what the moment needs, at most one callout per chapter, never text that leaves before it can be read, and never text that jumps position.
- **One thing at a time** (the user: "while reading one we cannot read the other"): within a chapter, the heading forms (by 0.18 of the chapter), then the callout line by line, then the status or question, then the action, each after the one before has been read; nothing forms while something else is forming, and headings leave late (0.82 → 0.99). Check any timing change with the formation audit (every text element's 10–90 % window against the story position; no overlaps).
- **Motion:** everything the visitor reads follows the scroll, never its own timer (a timed build was missed by visitors who had already scrolled on). No blur, scatter, rise, wipe or other slide-deck entrances on words (the user: "looks like a presentation slide animation"); no fade-up reveals. Nothing feels sped up; changes of speed are gradual.
- **Effects:** every visual effect comes from the simulation or the pulse. No decorative particles.
- **Branding:** never use NASA logos or branding. Keep the unofficial notice visible at every size. The expedition and its discoveries are fictional, and the site says so.
- **Audio:** none before a user gesture; the noise-based ambience was rejected as "disturbance". No sound on text: a tick on each callout landing made every chapter change feel like it stopped ("tick tick"), so callouts, headings and status lines are silent. Sound marks story events only, and must keep the scroll feeling continuous.
