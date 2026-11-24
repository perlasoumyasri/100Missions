# Brief: Mission 002, NEREID

**Date:** 2026-11-24

## Source brief (the challenge)

> Design and build a visually stunning **hero section** for a fictional NASA mission. Use **vgpu**: explore the examples, pick a visual, copy its prompt into Claude Code, and turn it into a landing page hero. Use the vgpu visual as the main focus. Add a strong headline, supporting text and a CTA that fit the mission. Make it feel cinematic, futuristic and visually impressive. Don't make it look like a generic landing page; make the visual experience the hero.

Scope is one hero section, not a multi-page site. The example's source was pulled with `vgpu examples pull fft-ocean`, which serves the same source the site's Copy Prompt does.

## The idea in one sentence

A cinematic WebGPU hero for NEREID, a fictional expedition into the ocean under Europa's ice: half a million particles make a living ocean, and one button sends you down into it with a sonar pulse.

## Why this mission

To push AI-assisted creative development past landing-page habits. The experiment is to take a real WebGPU pipeline (the vgpu Particles ocean: an FFT ocean simulation, instanced particles, HDR bloom), understand it, and art-direct it into a single crafted moment.

## Who it's for

People who follow the 100 Missions challenge on LinkedIn and X, mostly on laptops, often on phones.

## The core experience

1. The page opens on a dark ocean of luminous points moving under the title "The ocean beyond Earth." Instrument markings sit quietly at the edges.
2. The visitor presses **Initiate descent**.
3. The camera drops and pitches towards the water in one continuous move. The depth scale and readouts follow the move.
4. On arrival, a sonar pulse leaves the probe and travels out through the particles as a ring of light. The wave lifts the particles it passes.
5. Behind the ring the ocean is "mapped": depth contours appear. When the ring reaches a thermal anomaly, its annotation appears and the interface switches to the survey state.
6. **Return to surface** reverses the move and clears the scan.

## Must have

- **Superseded in part:** [design.md](design.md) now defines the copy, states and acceptance criteria, and [art-direction.md](art-direction.md) defines the look.

- The real vgpu fft-ocean pipeline, modified, not imitated.
- Mission name, eyebrow, headline, description and CTA exactly as given.
- Descent, sonar pulse, scan reveal, interface state change and reset.
- Adaptive rendering quality, a designed reduced-motion version, and a fallback when WebGPU isn't available.
- A clear line that this is an unofficial, fictional concept, not affiliated with NASA.
- Works from 390px phones to large desktops.

## Nice to have

- Gentle pointer parallax on the camera.
- A synthesised sonar ping, off until the visitor turns it on.

## Out of scope

- Sections beyond the hero.
- NASA logos, branding or any claim of affiliation.
- Stock space or ocean imagery.

## Constraints

- vgpu (WebGPU) for all rendering. No CSS or video stand-ins for the ocean.
- Deep ocean darkness, icy cyan, silver-white type. No purple gradients, no pill-heavy UI, no HUD clutter.

## Done means

The original example is shown to render. The transformed hero is checked by screenshots at desktop and phone sizes, the whole interaction works with mouse, keyboard and touch, reduced motion and the no-WebGPU fallback are designed, and it passes the visual-quality ship bar.

## Open questions

- Reference images were mentioned but not received.
