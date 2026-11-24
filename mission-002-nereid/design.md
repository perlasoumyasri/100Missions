# NEREID — Design and interaction specification

> Mission 002 · 100 Missions · North Star project
> Read `art-direction.md`, `references/README.md` and `storyboard.md` before making visual changes.

## 01 / Project scope

**Updated 2026-11-24:** the scope is now one continuous, scroll-driven expedition in seven chapters (The Opening, Arrival, The Fracture, First Contact, The Anomaly, The Discovery, The Transmission), still a single page rather than a multi-page site. See [storyboard.md](storyboard.md). The original scope follows for reference.

Design and build one exceptional, responsive, interactive hero for a fictional NASA-inspired mission to Europa. This is an experiential landing page, not a full multi-page site. The hero includes its own exploration state so that the primary CTA actually delivers an experience.

**Primary outcome:** a visitor understands the premise within seconds, experiences awe at the rendered environment, and is invited to explore it.

Creative ambition is unrestricted. Scope additions should serve the hero's story and be technically viable. If implementation is already in progress, inspect it first and evolve it rather than deleting working code indiscriminately.

## 02 / Content and hierarchy

| Element | Copy / behavior |
| --- | --- |
| Identity | NEREID / EUROPA EXPEDITION |
| Eyebrow | THE NEXT FRONTIER IS BELOW. |
| Primary headline | The ocean beyond Earth. |
| Description | A journey beneath Europa's frozen surface, in search of conditions that could support life beyond our own world. |
| Primary CTA | Initiate descent |
| Exploration state | Descent in progress → Ocean reached → Scan complete |
| Secondary action | Return to surface (available after initiating descent) |
| Optional context | Destination: Europa · Jupiter system |
| Disclaimer | Unofficial fictional mission concept. Visuals and scan data are simulated. |

Use meaningful, sparse content. Do not fabricate a launch date, real measurements, discovery claims or official mission credentials. If fictional telemetry is added, label it as simulation and use internally consistent values. No nonfunctional navigation links.

## 03 / Composition

### Desktop: immersive editorial frame

- Full-bleed WebGPU environment covering the viewport; CSS/HTML overlay remains independently readable and accessible.
- Minimal expedition wordmark at upper left; destination or concept marker at upper right. Use a thin rule only if it helps composition.
- Establish an asymmetric editorial grid (12 columns is a useful starting point). Place the headline in the left/upper-middle area of the quietest part of the scene, spanning roughly 5–7 columns. Explore more unusual placement if the references support it.
- Main visual occupies the majority of the frame, with its luminous fracture or strongest form positioned diagonally or opposite the typography. It can cross layout boundaries, but must not obscure the text.
- Description and the primary action belong to the same hierarchy as the headline. Make the CTA unmistakably interactive, with a distinctive understated shape, not a generic pill.
- Use sparse depth or scan markings at the periphery; the center must not become a dashboard.
- Footer edge contains the minimum necessary destination context and fictional-concept disclosure.
- Keep important content within safe margins; a starting gutter is 4–6vw. Test 1440×900 and 1280×720, not only a large design canvas.

### Mobile: recompose, don't shrink

- Prioritize the headline and CTA, then compose the GPU focal point around or below them. Reframe the camera for narrow aspect ratios instead of simply cropping a desktop screenshot.
- Use a minimum viewport height where useful but permit vertical scrolling on shorter devices; avoid clipped content and respect safe-area insets.
- Keep touch targets at least 44×44 CSS pixels as a design target, with space between controls. Reduce instrument markings and particle density before compromising text or focal point.
- Check 390×844, 360×640 and a tablet viewport. Do not hide the disclaimer, CTA or reset action.

## 04 / Visual design system

- Start with the palette and material language in `art-direction.md`. Define CSS tokens for surfaces, text, accent, typography, spacing and motion so adjustments are coherent.
- **Type families (2026-11-24):** Bodoni Moda for the mission title and chapter headlines; IBM Plex Sans for narrative, navigation and controls; IBM Plex Mono for annotations, coordinates, depth readings and telemetry. All OFL. Use robust fallbacks. The kinetic rules, the avoid list and the font package notes are in `art-direction.md` 04b.
- **Type scale.** Each value is one linear `clamp()` from a 390px viewport to a 1920px viewport. The rem part keeps text scaling with the user's font size.

| Role | Target | Fluid value | 390px | 1280px | 1920px | Leading and tracking |
| --- | --- | --- | --- | --- | --- | --- |
| Mission title (NEREID) | 120–220px on large desktop | `clamp(3.5rem, 0.887rem + 10.72vw, 13.75rem)` | 56px | 151px | 220px | Line height 1. Tracking 0.18em on phones, 0.22–0.28em from about 1024px |
| Chapter headline | 64–112px | `clamp(2.5rem, 1.353rem + 4.706vw, 7rem)` | 40px | 82px | 112px | Line height 0.95–1.05. `font-kerning: normal`, `font-optical-sizing: auto`, no added tracking |
| Supporting narrative | 16–20px | `clamp(1rem, 0.936rem + 0.261vw, 1.25rem)` | 16px | 18.3px | 20px | Line height 1.5–1.6. Measure about 60–70 characters |
| Annotation (secondary) | 11–13px | `clamp(0.6875rem, 0.656rem + 0.131vw, 0.8125rem)` | 11px | 12.2px | 13px | Line height 1.4. Tracking 0.02–0.06em |
| Annotation (essential) | 12–13px | `clamp(0.75rem, 0.718rem + 0.131vw, 0.8125rem)` | 12px | 13px | 13px | As above. Reaches 13px at about 1155px |

- **Where the ranges land.** The title passes 120px at about 990px wide and reaches 220px at 1920px. Chapter headlines pass 64px at about 900px. Above 1920px all values hold at their maximum.
- **Phone minimums.** Title 56px: NEREID in capitals at 0.18em tracking is roughly 5.3em wide, so about 300px. That fits the 358px column at 390px and the 328px column at 360px (estimate; confirm on a screenshot). Headlines 40px, so a four-word line breaks into two or three lines in a 358px column. Narrative never below 16px. 11px is only for secondary labels such as scale ticks and coordinates. Anything a visitor needs to read (the disclaimer, live readings, state changes) uses the essential row and never drops below 12px.
- If the mission title becomes longer than NEREID, recompute the title clamp so it fits the phone column.
- Avoid orphaned words and poor line breaks. Wide tracking belongs to the mission title only. Avoid overusing uppercase microtext.
- Contrast: target WCAG AA (4.5:1 for normal text, 3:1 for large text and relevant UI visuals). Evaluate against the actual moving background; use a localized scrim or a quiet visual area if required.
- Visualize at least two composition variants if the first reads as a conventional marketing hero. The art direction takes precedence over these suggested numbers.

## 05 / Signature interaction and states

| State | Environment | Interface |
| --- | --- | --- |
| Loading | Representative still frame, then smooth scene entrance | Headline readable immediately; no endless spinner |
| Surface / idle | Ice–ocean boundary, slow fluid movement and atmospheric depth | Headline, description, Initiate descent |
| Descent | Camera advances through the luminous boundary; smooth change in depth and lighting | Action enters a clear busy state; optional skip; progress communicated without fake measurements |
| Ocean reached | Camera settles into a vast submerged environment | Short exploration status; sonar starts or can be triggered |
| Scan | A coherent pulse propagates through the world and reveals hidden forms | Minimal simulated scan annotations appear; result is readable |
| Exploration complete | Calm, compelling final scene | Return to surface; optional replay scan if actually implemented |
| Reset | Controlled return or intentional crossfade | Restore initial scene and accessible focus |
| Fallback / reduced motion | Carefully art-directed still or low-motion representation of each meaningful state | Same content and functional controls without cinematic travel |

Suggested pacing: ambient motion never competes with reading; button feedback is immediate; descent can take around 2–4 seconds and sonar around 1–2 seconds, subject to visual testing. Provide a skip or instant alternative for extended transitions. Avoid motion that causes dizziness, flashing or an interaction that locks users in.

Optional cursor parallax is subtle, desktop-only and nonessential. Touch users should receive an equally coherent experience. No audio autoplay.

## 06 / Engineering approach for Claude Code

1. Inspect the current project, dependencies and rendering pipeline. Preserve working implementation and existing project conventions.
2. Read the official vgpu repository and relevant examples; install agent resources only if needed and according to current official instructions. Reuse the Particles ocean example as a working foundation rather than approximating it with CSS or a stock background.
3. Establish a reproducible baseline. Verify initialization, resize, cleanup, shader compilation and actual rendered output before combining effects.
4. Separate the scene/rendering module, visual tuning values, accessible DOM overlay and exploration state machine. Avoid reinitializing GPU resources on ordinary UI state changes.
5. Implement the signature interaction through camera, shader or scene parameters and synchronize the overlay with the state machine. Evaluate candidate techniques individually before merging them.
6. Push visual quality through coherent depth, lighting, form, composition and motion. Explore high-ambition enhancements after the core scene is visually strong; remove effects that add cost without improving the experience.
7. Provide adaptive quality: cap render resolution appropriately, tune particle counts and costly effects to measured device performance, pause rendering when not visible where feasible, and release GPU resources on unmount. Keep fallback paths for unavailable WebGPU, initialization failure and device loss.
8. Respect `prefers-reduced-motion`, keyboard operation, visible focus and semantic HTML. Announce important state changes without flooding screen readers. Give purely decorative canvas elements appropriate accessibility treatment.
9. Test actual output, not only compilation. Use browser screenshots and interaction testing when tools are available. If a GPU-capable browser is not available, disclose which render checks could not be performed; do not claim visual verification from code alone.

Avoid adding libraries just because they exist. Prefer proven compatible implementations; integrate additional tools only when they unlock a meaningful improvement.

## 07 / Acceptance criteria

- [ ] First frame is visually arresting even as a screenshot; a clear focal point, distinctive type hierarchy and controlled negative space are visible.
- [ ] The environment is a meaningful reinterpretation of the vgpu foundation, not the unchanged demo with UI layered above it.
- [ ] Visual identity matches the approved references and feels authored, not generic AI-generated design.
- [ ] The real-time scene has convincing depth, intentional lighting and organic motion.
- [ ] The CTA triggers a coherent, memorable change in scene and interface; reset works repeatedly.
- [ ] All essential controls work with keyboard and touch; focus and state changes make sense.
- [ ] Text remains readable across frames; mobile layout is independently composed.
- [ ] Performance is measured on available hardware, with adaptive quality and no obvious sustained stuttering. Record device/browser and observed frame rate rather than claiming universal smoothness.
- [ ] Fallback works when WebGPU is unavailable; reduced-motion mode avoids forced camera travel.
- [ ] No broken links, console errors, unhandled initialization failures or misleading official NASA claims.
- [ ] Review screenshots of idle and exploration states and a short motion recording before declaring the build finished.

## 08 / Final review and handoff

Claude should report briefly: the implemented creative direction, techniques reused and original changes, reference-to-design decisions, what was verified, and any limitations or remaining visual opportunities. If actual render checks fail, fix the core issue or state the limitation clearly.

The standard is not simply that the site runs. The standard is that the experience communicates the mission, looks distinctive, feels cinematic and demonstrates thoughtful creative engineering.
