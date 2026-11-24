---
name: art-direction
description: Workflow for turning a mission brief into a specific visual direction and filling in the mission's art-direction.md: concepts, references, palette, type, motion personality, voice. Use when writing or revising art direction.
---

# Art direction workflow

How to go from a brief to a clear, specific visual direction, written down in the mission's `art-direction.md`. The process is shared. The result should be different every time.

## The goal

The finished `art-direction.md` should be specific enough that two people building from it would make work that feels like the same project. "Clean and modern" fails that test. "A 1970s Indian railway weighing machine, seen through a VHS tape: lavender paper, fuchsia ink, chunky pixels, a mechanical ritual" passes.

## Workflow

### 1. Start from the brief, not from a style
Re-read `brief.md`. Write down the **core feeling** someone should leave with, in a few words (e.g. "a small ritual of luck", "calm focus", "chaotic joy"). Style choices come later and must serve that feeling.

### 2. Find the concept (the metaphor)
Ask: *what is this thing, if it were a real object, place, era or medium?* A to-do list could be a train departures board, a stack of paper receipts or a garden. The concept decides the visual world, the interaction metaphors and the copy voice together.

- Generate at least **three different concepts** before choosing one. The first idea is usually the most obvious one.
- Each concept gets a one-line pitch and a note on what it would make the core interaction feel like.

### 3. Collect references
- Save references in the mission's `references/` folder and list them in `references/README.md` with their source and **what specifically** to take from each (a colour, a texture, the way a thing moves). "I like this" is not a note.
- Look beyond websites: physical objects, packaging, signage, film, games, print, architecture, nature, period ephemera. Websites that look like other websites produce websites that look like other websites.
- References are for inspiration and understanding. Never copy a specific artwork, character, game or brand.

### 4. Explore before committing
For the strongest one or two concepts, make quick explorations: a single hero screen or the key moment, at rough fidelity. Throwaway HTML, a canvas sketch or a generated image are all fine. Show the user and pick a direction together. Don't polish an exploration.

### 5. Define the system
Once a direction is chosen, write it down in `art-direction.md`:

| Section | What to define |
|---|---|
| **Concept** | The one-line concept and the core feeling |
| **Mood words** | 3–5 words it *is* and 3–5 it *is not* (the "is not" list is often more useful) |
| **Colour** | Palette with roles and hex values, and how colour behaves (flat, glowing, printed, light-emitting) |
| **Typography** | Faces, roles, scale and any special treatments |
| **Shape and texture** | Corners, lines, grain, depth, material (paper, glass, metal, pixels, clay) |
| **Imagery and illustration** | Style, how it's made (SVG, pixel grid, 3D, photo, generative) and characters, if any |
| **Layout and composition** | Grid or anti-grid, density, framing, where the focal point lives |
| **Motion personality** | How things move: snappy, floaty, mechanical, elastic, frame-by-frame. See the `animation` skill |
| **Sound** | If any: palette, triggers, mute behaviour |
| **Voice** | How the copy sounds, with two or three example lines |
| **Do / Don't** | Concrete rules that keep the direction consistent |

### 6. Pressure-test it
- Does every section serve the core feeling? Remove what doesn't.
- Does it work at 390px wide? With reduced motion? With sound off? For a keyboard user?
- Is anything in it a default you didn't choose? (Framework theme, system font, generic gradients.)

### 7. Keep it alive
The art direction can change during the build, and often should once you see the real thing. When it changes, update `art-direction.md` so it always describes what is actually being built.

## Tools for exploration

Use whatever is fastest for the question: sketch HTML/CSS, a canvas, a Figma frame, an image-generation tool for mood exploration, or real photos of objects. Generated images are for exploring direction only. Shipped art is made for the mission and credited.
