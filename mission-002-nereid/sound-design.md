# NEREID — Sound Design

> Creative source of truth for the fictional Europa expedition. Read alongside `art-direction.md`, `design.md`, and `references.md`. Where older instructions conflict, follow the latest approved narrative storyboard. This document specifies direction, not existing audio assets or implemented features.

## 1. North Star

Sound should make the visitor feel as if they are inside an autonomous scientific expedition travelling from the silence of space, through ancient ice, into an unfamiliar ocean. The audio is an invisible environment, not a soundtrack pasted onto a website. Every cue must establish place, scale, action, discovery or emotion.

**Feel:** immense, intimate, restrained, mysterious, physical, intelligent, gradually hopeful. Contrast the almost silent vacuum with the enclosed ice passage and the vast, submerged world. Let silence carry tension. Aim for film-quality sound design rather than a game menu, sci-fi trailer or generic ambient playlist.

Use original synthesized sound and/or appropriately licensed recordings. Do not rip scores or effects from films. Interstellar is a reference for emotional scale and patience, Arrival for restraint and ambiguity, and underwater documentary sound for texture and spatial perspective; none is a request to imitate a recognizable theme.

## 2. Sonic palette

| Layer | Character | Implementation direction |
|---|---|---|
| Environment | Deep, almost subliminal pressure; distant mechanical resonance | Slow filtered noise and evolving harmonic bed; subtle audible harmonics so it works without a subwoofer |
| Ice | Glassy, brittle, ancient, irregular | Sparse crystalline ticks, low creaks and short refracted tails; avoid literal glass breaking repeatedly |
| Ocean | Dense, muffled, suspended, enormous | Soft filtered noise, drifting granular textures and occasional distant resonances; no constant bubbling |
| Probe | Precise, engineered, non-aggressive | Small mechanical servo textures, soft electronic confirmation tones |
| Sonar | Clean, localized, informative | Rounded sine/short chirp with soft spatial echoes; time the return to visual reveal |
| Discovery | Warm, organic, quietly extraordinary | A subtle harmonic opening, warm tonal resonance and rising fluid texture; no triumphant trailer hit |
| Transmission | Fragile, distant, purposeful | A few clean signal pulses and soft decaying harmonics |

Create a recognizable sonic motif: a short pair of related tones for probe confirmations, expanded into a slower harmonic interval at discovery and transmission. Keep it original and unobtrusive.

## 3. Chapter-by-chapter sound storyboard

| Scene | Idle / environment | Traversal and reveal | Emotional result |
|---|---|---|---|
| 00 — Opening | Near silence, faint synthesized resonance | A barely audible swell synchronized with the title formation and planetary reveal; no loud intro hit | Curiosity, scale |
| 01 — Arrival | Low spacecraft interior/telemetry bed | A gradual spatial sweep as orbital path draws; tiny confirmation on arrival | Anticipation |
| 02 — Fracture | Low ice pressure, sparse crystalline creaks | Narrow filtered texture as the camera passes through ice; increasing enclosure and changing resonance; a brief textured ice breakthrough cue | Tension, confinement |
| 03 — First contact | Wide, muffled ocean ambience; soft suspended texture | Reduce the enclosed ice sound, moment of quiet, then open stereo space with a low pressure pulse as the environment expands | Awe, release |
| 04 — Anomaly | Restrained deep-water bed | Sonar ping at emission, faint delayed echoes as terrain appears, distinct quiet two-tone confirmation when the thermal anomaly locks | Mystery, discovery |
| 05 — Discovery | More organic fluid texture; warmer harmonics | Slowly open the tonal bed as the vent comes into view; a soft harmonic resolution without suggesting confirmed life | Wonder, possibility |
| 06 — Transmission | Ocean bed gradually becomes sparse | A short sequence of signal pulses follows the visual transmission wave; settle into a long, quiet tail | Reflection, hope |

Scientific note: sound does not propagate through the vacuum of space. Opening and orbital audio are non-diegetic score or interior instrument sounds, not literal exterior spaceship noise. Europa's sounds and mission telemetry are artistic simulations, not actual recordings from Europa. Potential habitability is not proof of life.

## 4. Button and interface sound language

Do not attach the same beep to every control. Keep all interface cues in the same sonic family; make their contour, texture and duration match the action. These four are the proposed principal controls; map them to the existing UI rather than adding unnecessary controls to the cinematic composition.

| Control | Hover / focus | Activation and feedback |
|---|---|---|
| Begin expedition / initiate descent | Optional subtle air-like tick (35–65 ms), pointer only, rate-limited | Soft mechanical click followed by a low-to-high two-tone ignition/confirmation (200–450 ms); blend into camera movement |
| Initiate sonar scan | Optional faint instrument tick | Focused rounded sonar ping (120–250 ms), then spatially distributed return echoes when the simulated scan returns. Avoid repeated pings while scan is active |
| Replay / restart expedition | Optional quiet tick | Short reverse-feeling tonal glide or softened mechanical reset (150–300 ms), fade old ambience before restarting |
| Sound on / off | No hover sound necessary | Tiny rounded confirmation when enabling; when disabling, fade out immediately with no additional audible cue after mute |

Other ordinary navigation: use a quiet tactile click only on purposeful activation, not every hover or scroll event. Keyboard navigation must not fire sounds on every focus movement. A disabled or unavailable action should not play a success cue. Do not add sound-dependent feedback; visual state must always communicate the result.

## 5. Traversal / scroll / camera movement

- Sound describes continuous movement through the world, not scrolling a page.
- Map filtered texture intensity and stereo motion to **smoothed camera velocity** and depth/state. Faster movement may gently increase the texture; it must never become a loud whoosh on each wheel tick.
- During descent through ice: narrow the stereo field, darken the spectrum, let small crystalline resonances pass the listener. At the ice–ocean boundary: open the stereo field and let the texture bloom into a submerged ambience.
- Underwater traversal: low, soft displacement texture; gentle granular movement, occasional distant tonal resonance. No perpetual motor hum or cartoon water sounds.
- When scrolling stops: movement-specific sound fades within roughly 300–700 ms; the environment stays alive at a quiet baseline.
- When scrolling backwards: blend back toward the previous scene; do not spam reverse hits or repeat one-shot narration. Permit intentional replay on re-entering a scene after a meaningful reset.
- Use the camera's actual progress rather than raw scroll events; avoid abrupt pitch changes, jitter and audio drift.

## 6. Transitions and cinematic choreography

A scene transition is a change in physical context and emotional state. It must not sound like a stock page-transition swoosh.

| Transition | Cue design | Approximate timing |
|---|---|---|
| Space → arrival | Low restrained tonal sweep, a precise signal lock | 0.6–1.4 s |
| Arrival → ice | Closing filtered resonance, subtle crystalline texture | 0.8–1.8 s |
| Ice → ocean | Short reduction in ambience, gentle pressure release, wider underwater tail | 1.5–3 s |
| Ocean → sonar | Brief attenuation of ambience for the scan pulse, then gradual return | Match pulse and simulated echoes |
| Sonar → vent discovery | Cold-to-warm harmonic change, soft fluid-texture emergence | 2–4 s |
| Discovery → transmission | Signal pulses and long decaying harmonic tail | 2–5 s |

Times are starting points, not rigid rules. Sync to the actual visual event (breakthrough, scan emission, echo, reveal), not arbitrary scroll thresholds. Use equal-power ambience crossfades, short gain ramps and restrained dynamics. Leave room for silence; avoid stacking every effect at full volume.

## 7. Typography and micro-interactions

- Main title: one evolving tonal swell beneath the entire reveal, not a click for each character.
- Chapter headline: generally silent; use a scene-linked texture only where it strengthens the visual reveal (e.g. the fracture mask or transmission dissolve).
- Telemetry: quiet instrument feedback on meaningful status changes, not every digit update.
- Sonar labels: a tiny precise confirmation when a new data point is deliberately selected or locked; never dozens of simultaneous ticks.
- Pointer motion, ordinary text reveals, decorative particles and routine UI states do not need audio.

## 8. Mixing and spatial design

Use separate buses for ambience, tonal bed, traversal, interface and cinematic events. Route through master gain and a gentle peak limiter. Starting targets (adjust by ear): ambience peaks around -28 to -20 dBFS per layer, interface around -24 to -16 dBFS, major cues around -18 to -10 dBFS, combined output below -1 dBFS. These are indicative digital peak targets, not a substitute for perceived loudness or a final mix.

Keep the default listening level comfortable and subdued. Test on laptop speakers, phone speakers and headphones. Make short cues intelligible without relying on extreme bass or sharp high frequencies. Use subtle stereo width and panning; preserve mono compatibility. Briefly duck ambience by a few dB for key sonar or discovery cues only where useful.

## 9. Implementation guidance for Claude Code

1. Inspect the current scene controller, camera motion, button states and transition events before choosing an audio architecture. Keep audio separate from the render loop.
2. Use the Web Audio API (or an established compatible audio library if it meaningfully improves the result). Use gain nodes, filters, oscillators, generated noise, short envelopes, optional spatial panning and crossfades. Prefer authored/procedural original cues where practical. If using external assets, verify license and attribution requirements, source and store them locally; do not hotlink arbitrary media. Do not assume access to an audio-generation service.
3. Create one audio engine and one master bus, with explicit lifecycle management. Suggested interface: `enable()`, `mute()`, `setScene(sceneId, progress)`, `setTraversal({ velocity, depth })`, `playCue(cueId)`, `dispose()`. Adapt to the actual codebase.
4. Suggested cues: `expedition-start`, `ice-breakthrough`, `sonar-emit`, `sonar-return`, `anomaly-lock`, `discovery-reveal`, `transmission`, `reset`, `ui-hover`, `ui-confirm`. Connect them to real animation events. Deduplicate and throttle cues; avoid restarting loops every frame.
5. Start muted. Provide a clearly discoverable, keyboard-accessible sound control with on/off state and preferably volume control. Resume the audio context only on an explicit user gesture; handle blocked playback gracefully. Persist preference if appropriate, but never bypass autoplay restrictions. On mute, cancel or fade active cues; on re-enable, resume the current scene without replaying the entire opening.
6. When the tab is hidden, pause/fade or suspend audio; resume only if sound was enabled. Clean up nodes, timers, listeners and buffers on unmount. Respect reduced-motion preferences independently of sound; offer a fully silent experience. No microphone permissions required.
7. Keep loading lightweight: lazy-load/decode larger sounds after explicit interaction, use procedural cues when useful, and do not delay hero rendering for audio. Maintain smooth GPU performance. Audio failures must never block navigation or the visual experience.

### Four-button audition panel (development only)

Before integrating the final mix, build a small dev-only sound audition panel with four clearly labelled working controls. This is for the designer to compare sound directions, not a permanent overlay on the public hero.

1. **UI / Button** — plays the proposed tactile confirmation cue.
2. **Traverse** — plays a short movement envelope representing ice descent into water.
3. **Transition** — plays the breakthrough and ocean-reveal crossfade.
4. **Sonar / Discovery** — plays scan emission, delayed echo and anomaly confirmation in sequence.

Include a stop/mute mechanism, prevent overlapping auditions, and make it easy to replay and refine. If a dev panel is impractical, expose equivalent isolated preview controls in a local test route. Remove or hide it in production. The four main expedition controls described in section 4 still need appropriate sounds wherever they exist in the approved UI.

## 10. What it must NOT sound like

- Generic sci-fi laser beeps, spaceship alarm loops, arcade UI, aggressive bass drops or trailer booms.
- A recognizable Interstellar theme, borrowed movie score, or a random ambient track playing uninterrupted.
- A sound on every letter, particle, mouse move or scroll tick.
- An endless wall of drones, exaggerated heartbeat, horror stingers or cartoon bubbling.
- Loud, piercing pings, sudden volume jumps, phasey stereo or repetitive transitions that become exhausting.
- Audio that starts unexpectedly, cannot be muted, or is required to understand the experience.

## 11. Acceptance criteria

- [ ] The four audition controls play distinct, intentionally crafted sounds and do not overlap uncontrollably.
- [ ] Expedition actions have feedback that matches their purpose; repeated interactions are not fatiguing.
- [ ] Each chapter has a recognizable sonic identity; transitions feel spatially and narratively connected.
- [ ] Traversal sound follows camera motion, eases out at rest, and remains stable on rapid or reversed scrolling.
- [ ] The ice-to-ocean breakthrough is the strongest moment of spatial opening; discovery is a warmer, quieter emotional payoff.
- [ ] Sonar cues align with the visual pulse and echo; the anomaly has a recognizable confirmation.
- [ ] The score leaves space for silence and does not compete with typography or the visual experience.
- [ ] No unexpected autoplay; mute, keyboard controls and silent navigation work; no stale playback on route changes or hidden tabs.
- [ ] Listen at low volume on headphones and ordinary speakers; check for clipping, harshness, repetitive sounds, synchronization and performance.
- [ ] All audio is original or appropriately licensed, with any required credits recorded.

## 12. Handoff to Claude

Read this file and the current storyboard. First propose a cohesive sonic palette and an event-to-sound map based on the actual implementation. Build the four-button audition panel with playable original or licensed cues, then integrate the approved direction into the expedition. Evaluate the actual audible results in the browser where playback is available; do not claim to have listened if you only inspected code. Provide a concise summary of implemented cues, asset sources, any limitations and how the designer can adjust the mix. Make the whole experience feel like one deliberately sound-designed film, not a collection of unrelated effects.
