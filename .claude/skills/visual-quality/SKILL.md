---
name: visual-quality
description: Review pass and scoring rubric for judging whether a mission is ready to ship: run it, screenshot breakpoints, check accessibility, motion and performance. Use before calling visual work done or when asked how it looks.
---

# Visual quality evaluation

How to judge whether a mission is good enough to ship. Quality is judged against the mission's own brief and art direction, not against a house style. A deliberately rough, glitchy mission can score full marks if the roughness is controlled and intended.

## Rule: look at it

Never call visual work done from reading the code. Run it, screenshot it and look at the screenshots. Check every claim in this skill on the real rendered output.

## The review pass

### 1. Run it and capture
- Start the dev server (or a production build preview for the final check).
- Take screenshots at **390×844** (phone), **768×1024** (tablet), **1280×800** (laptop) and **1920×1080** (large). Add any size the brief specifically targets.
- Capture each key state: first load, mid-interaction, result, empty, error.
- Record or step through signature animations. A still frame can't show timing problems.

### 2. Check functionality
- Click through every path with a mouse, then with only the keyboard, then with touch (or touch emulation).
- Watch the console: zero errors and warnings.
- Interrupt things: double-click, resize mid-animation, switch tabs and come back, use the back button.

### 3. Check accessibility
- Keyboard: logical focus order, visible focus everywhere, no traps.
- Turn on `prefers-reduced-motion` and use the whole thing.
- Turn sound off. Is anything essential lost?
- Contrast: check text and key UI against WCAG AA.
- Screen reader: important state changes are announced, and images and controls have labels.

### 4. Check performance
- No layout shift on load. Animation stays smooth (use the browser's performance panel if anything feels off).
- Check on a throttled CPU or a real mid-range phone for canvas/WebGL missions.
- Production build size is reasonable for what it does.

## Scoring rubric

Score each from 1 to 5 against the mission's own art direction. Write the scores and one line of evidence in the review.

| Dimension | 5 looks like |
|---|---|
| **Concept clarity** | Within five seconds, a new visitor understands what it is and what to do |
| **Art direction fidelity** | Everything on screen belongs to the chosen direction. Nothing looks like a default |
| **Hierarchy & composition** | One clear focal point per moment. Passes the squint test at every breakpoint |
| **Typography** | Intentional faces, consistent scale, correct punctuation, no awkward breaks |
| **Colour** | Palette roles are consistent, contrast passes, all states are distinct |
| **Motion** | Every motion has a job, timing feels right, interruptible, a real reduced-motion version |
| **Interaction feel** | Immediate feedback, every state designed, the key moment feels satisfying |
| **Responsiveness** | Feels designed (not just squeezed) at every breakpoint, works with touch |
| **Craft details** | Favicon, title, loading, empty and error states, no flicker, crisp edges |
| **Delight** | At least one moment that makes someone smile or want to show a friend |

**Ship bar:** no dimension below 3, and an average of 4 or more. Concept clarity and art direction fidelity should be 4 or more. Anything below the bar gets fixed or explicitly accepted by the user.

## Common defects to hunt for

- Missing hover, focus, active or disabled states.
- Text that overflows, wraps badly or collides at 390px.
- Blurry pixel art or raster assets (non-integer scaling, missing high-DPI versions).
- Elements that are almost aligned.
- Too many accent colours, or an accent used for both "action" and "decoration".
- Animations that block input, can't be interrupted or replay when they shouldn't.
- Placeholder copy, inconsistent voice, or a generic page title.
- Something that looks great on desktop but was clearly never looked at on a phone.

## Reporting

Report what was checked and what was found, with screenshots where useful: the scores, the defects fixed and anything left for the user to decide. Say plainly what wasn't checked (e.g. "not tested on a real phone").
