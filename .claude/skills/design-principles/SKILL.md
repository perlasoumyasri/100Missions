---
name: design-principles
description: Quality standards for layout, typography, colour, hierarchy, interaction states and craft details. Use when making or critiquing UI design decisions in a mission. Sets a quality bar, not a style.
---

# Design principles

Standards for how good the work should be, not for how it should look. A brutalist text page, a soft 3D toy and an 8-bit machine can all meet them. A mission's `art-direction.md` decides the look. This skill decides whether that look was done well.

## 1. One idea, fully committed

- Every mission should have a single central idea you can say in one sentence ("a fortune machine that weighs what's on your mind"). Every decision should serve it.
- Commit fully. A half-committed style (pixel art with smooth gradients, a "brutalist" page with friendly rounded cards) reads as a mistake, not a choice.
- Cut anything that doesn't serve the idea, even if it's good. One brilliant interaction is better than five decent features.

## 2. Make it on purpose, not by default

Default output looks like default output. For each of the things below, make a choice and know why you made it:

- **Typeface:** chosen for the concept, not because it's the framework default. Pairings have a reason (contrast of role, period or texture).
- **Colour:** a deliberate palette with defined roles (background, surface, text, accent, signal). Not a framework theme used unchanged, unless that theme *is* the concept.
- **Layout:** derived from the content and concept, not a generic hero + three-card grid.
- **Corners, borders, shadows, texture:** one consistent shape language.
- **Copy:** written in the mission's voice. Placeholder-sounding text ("Welcome to our app") is a defect.

A useful test: if you swapped this mission's palette and fonts for another mission's, would the design still make sense? If yes, the design isn't specific enough yet.

## 3. Hierarchy

- At any moment there is one obvious thing to look at and one obvious thing to do.
- Build hierarchy with size, weight, contrast, space and position before reaching for colour.
- Squint test: blur your eyes (or the screenshot). The most important element should still be the most visible.
- Group related things and separate unrelated things with space before you use lines and boxes.

## 4. Typography

- Pick a type scale and stick to it. Few sizes with large steps between them read as more confident than many sizes close together.
- Body text: comfortable size for the medium (usually 16px+ on the web), line length around 45–75 characters, line height that suits the face.
- Display type can break the rules, but on purpose: tight tracking, huge sizes, stacking or distortion, if the concept calls for it.
- Check the details: real quotes and apostrophes (“ ” ’), en/em dashes where they belong, no orphaned single words in headlines, numbers aligned (tabular figures) where they change or line up.
- Bundle fonts locally when possible (faster, no layout shift, works offline).

## 5. Colour

- Define colour by role, then by value. Text colours must meet WCAG AA contrast (4.5:1 for body, 3:1 for large text and UI boundaries) against what they sit on.
- Limit accent colours. The more colours that shout, the less any of them is heard.
- Design states in colour too: hover, active, focus, disabled, error and success must all be distinct.
- If the mission has light and dark modes, design both. Don't just invert.

## 6. Space and rhythm

- Use a spacing scale (4px or 8px base, or whatever the concept implies) and apply it consistently.
- Generous space signals confidence. Crowding signals that nobody made decisions. Dense layouts are fine when density *is* the idea (dashboards, terminals, arcade cabinets), but they still need rhythm.
- Align things. Optical alignment beats mathematical alignment when they disagree (icons, round shapes, punctuation).

## 7. Interaction

- Every interactive element has all its states: default, hover, focus-visible, active/pressed, disabled, loading. Missing states are the most common sign of unfinished work.
- Feedback is immediate (under 100ms) even when the result takes longer: press states, a sound, a small motion.
- Make important actions feel physical and earned (see Mission 001: a coin and a wait made a random quote feel special). Make routine actions fast and quiet.
- Touch targets are at least 44×44px. Nothing important depends on hover alone.
- Errors and empty states are designed, written in the mission's voice and tell you what to do next.

## 8. Content is design

- Use real content from the start. Lorem ipsum hides layout and tone problems.
- Write microcopy in the mission's voice: buttons, toasts, empty states, alt text.
- Personality lives in the small things: a loading line, a 404 page, a reaction to an unusual input.

## 9. Craft details that separate good from great

- A favicon and a page `<title>` that match the mission. An Open Graph image if it will be shared.
- No flash of unstyled content or layout shift on load. Images and canvases have reserved space.
- Pixel-perfect where the medium demands it (pixel art snaps to whole device pixels, hairlines stay crisp).
- Scrollbars, text selection colour, focus rings and the cursor are styled to match when it matters.
- The first five seconds are designed: what someone sees and understands before they touch anything.

## 10. Accessibility is part of the craft

It's a design constraint, not a checklist at the end. Keyboard paths, focus order, screen-reader labels, contrast, reduced motion and sensible behaviour without sound are all part of the design. A bold, experimental style can still be accessible: provide an equivalent path rather than diluting the concept.
