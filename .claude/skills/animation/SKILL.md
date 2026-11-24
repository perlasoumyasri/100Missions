---
name: animation
description: Motion standards: purpose, timing, easing and springs, choreography, performance, reduced motion, choosing a motion tool. Use when adding or tuning animation, transitions, sprites or physics.
---

# Animation principles

Motion standards that apply whether a mission uses CSS, a JS motion library, canvas, WebGL, sprites or physics. The mission's `art-direction.md` defines the *personality* of motion. This skill defines what makes it good.

## 1. Every motion has a job

Before animating something, name its job:

- **Feedback:** confirms an action happened (press, toggle, drop).
- **Continuity:** shows where something came from or went (open/close, reorder, page change).
- **Attention:** points at what matters now. Use sparingly.
- **Character:** gives an object or creature life and personality.
- **Ritual and reward:** makes a key moment feel earned (Mission 001's coin → wheel → printer → ticket).

If a motion has no job, remove it. Ambient motion that runs constantly gets a low budget and must never compete with the focal point.

## 2. Timing

Rough starting points for UI. Tune by eye:

| Kind | Duration |
|---|---|
| Press / hover feedback | 80–150ms |
| Small element enter/exit (toast, tooltip) | 150–250ms |
| Larger transitions (panel, modal, page) | 250–450ms |
| Choreographed signature moments | 1–3s total, broken into beats |

- Exits are faster than entrances.
- Distance and size scale with duration: bigger moves take a little longer.
- A routine action someone repeats often should be quick. Save long sequences for moments that happen rarely and matter.

## 3. Easing and physics

- Avoid `linear` for UI movement (fine for continuous rotation, progress and mechanical loops).
- Entering: ease-out (fast start, gentle settle). Exiting: ease-in. Moving on screen: ease-in-out.
- Springs feel physical and handle interruption naturally. Prefer them for draggable, gestural and responsive elements. Tune stiffness and damping to the mission's personality (heavy machinery vs. a bouncy toy).
- Stepped timing (`steps()`, fixed frame rates) is a legitimate style choice for pixel art, stop-motion and mechanical feels. Choose it on purpose.

## 4. The classic principles, applied to interfaces

- **Anticipation:** a small wind-up before a big action (a squash before a jump, a pull-back before a launch).
- **Follow-through and overlap:** parts don't stop at the same instant. Secondary elements settle slightly after the main one.
- **Squash and stretch:** conveys weight and flexibility. Keep volume roughly constant.
- **Staging:** one main action at a time. Dim, pause or simplify everything else.
- **Arcs:** natural things move in curves, not straight lines.
- **Secondary action:** small supporting motion (a blink, a wobble) adds life without taking focus.
- **Exaggeration:** push it a little further than feels safe, then pull back until it reads clearly.

## 5. Choreography

- Plan signature sequences as beats on a timeline (in code or a comment): what happens, when, and what sound goes with it.
- Stagger groups by 20–60ms per item, capped so long lists don't take forever.
- Sync sound to motion on the frame it should land. Off-by-50ms sound feels broken.
- Every sequence can be interrupted or skipped. Clicking again, navigating away or resizing mid-animation must never leave things in a broken state.

## 6. Performance

- Animate `transform` and `opacity` wherever possible. Avoid animating layout properties (`width`, `top`, `margin`) on anything large or frequent.
- Use `requestAnimationFrame` (or the library's loop) for JS animation, never `setInterval`.
- Pause off-screen and hidden-tab animation (IntersectionObserver, `visibilitychange`).
- For canvas/WebGL: cap device pixel ratio sensibly, reuse objects, avoid allocations inside the frame loop, and check on a mid-range phone.
- Target a steady 60fps. A steady lower frame rate is better than an unsteady high one.

## 7. Reduced motion

`prefers-reduced-motion: reduce` gets a designed alternative, not a broken one:

- Replace movement with instant state changes or short opacity fades.
- Keep the meaning: if motion showed that something was "printed", the reduced version still shows it arriving.
- Stop parallax, large zooms, auto-playing loops and camera movement.
- Test it: toggle the OS setting and use the whole experience.

## 8. Choosing a tool

Pick per mission based on the need (see the `library-discovery` skill for how to evaluate):

- **CSS transitions/keyframes:** state changes, simple loops. Zero dependencies.
- **Web Animations API:** imperative control over CSS-grade animation, no library.
- **A motion library** (e.g. Motion, GSAP, anime.js): springs, layout animation, timelines, scroll-linked effects, complex sequencing.
- **Canvas / WebGL / a 3D engine:** many objects, particles, shaders, 3D.
- **Rive / Lottie / sprite sheets:** designed character animation and illustrated motion.
- **A physics engine:** when things should collide, stack, fall or be thrown.

Don't add a library for something CSS does well. Don't fight CSS for something a timeline library does easily.
