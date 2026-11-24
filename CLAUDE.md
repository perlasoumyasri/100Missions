# 100 Missions

100 days, 100 missions, one shipped project a day. Each mission is an independent creative project with its own idea, art direction, stack and dependencies. They deploy together as one Vercel site: a mission board hub plus `/mission-NNN/` pages.

This file holds only what is shared. **It sets no aesthetic, visual style or tech stack.** Those belong to each mission.

## Layout

- `mission-NNN-<slug>/`: one independent app. Its `CLAUDE.md` (stack, commands, decisions) loads when you work there. `brief.md` and `art-direction.md` are read at the start of mission work. `references/` holds reference material.
- `.claude/skills/`: shared craft skills, loaded only when relevant: `design-principles`, `art-direction`, `animation`, `library-discovery`, `visual-quality`, `ship-mission`.
- `learnings.md`: reusable discoveries from past missions. Search it during discovery, and add to it when a mission ships.
- `_template/`: starting files for a mission. `hub/`, `missions.json`, `scripts/`: the shared site and build.

## Mission isolation and context efficiency

- Each mission is an independent application. Use one fresh session per mission, opened at the repo root or inside the mission folder.
- When the user says "mission N" (e.g. "work on mission 2"), the active mission is `mission-NNN-*/`. Read its `CLAUDE.md` first and stay inside that folder. If it doesn't exist yet, scaffold it (see Workflow) after confirming the slug and title.
- Restrict all exploration, file reads, searches and modifications to the active mission directory.
- Never scan, summarize or analyze previous missions unless explicitly requested. Never carry one mission's style, palette, libraries or code into another by default.
- Never perform repository-wide exploration unnecessarily. Shared files (`learnings.md`, `missions.json`, `README.md`) are read or edited only for a specific step.
- Load shared skills and `learnings.md` only when relevant to the current task. Don't automatically import lengthy documentation.
- Keep instruction files concise and avoid duplicating information.
- Install mission-specific dependencies, and any mission-specific skills (`<mission>/.claude/skills/`), locally in the mission folder.
- Prioritize context and token efficiency without compromising creative ambition or output quality.

## Workflow

The user directs each mission. **Only do the phase the user asks for.** A brief existing is not a reason to start building.

1. **Scaffold:** `npm run new -- <number> <slug> "<Title>"` from the repo root. Never create future missions ahead of time.
2. **Brief:** fill in `brief.md` with the user. Ask about anything ambiguous that changes what gets built.
3. **Art direction:** fill in `art-direction.md` (the `art-direction` skill), and save references to `references/`. Agree the direction with the user.
4. **Discovery:** choose the stack and libraries for this mission (the `library-discovery` skill). Record each choice and why under "Decisions" in the mission `CLAUDE.md`.
5. **Build:** the core moment first, then everything around it.
6. **Quality pass:** run it, look at it and score it (the `visual-quality` skill).
7. **Ship:** the `ship-mission` skill.

## Engineering standards (every mission, any stack)

- **Independent:** own dependencies and lockfile, and builds from its own folder. No imports across missions. Copy code if you want to reuse it.
- **Current:** check a library's current docs and version before using it. Don't rely on memory for APIs.
- **Responsive:** 390px phones to large desktops unless the brief says otherwise. Touch works as well as mouse.
- **Accessible:** semantic HTML, visible focus, labelled controls, AA contrast for text, announced state changes, a designed `prefers-reduced-motion` version, no audio before a user gesture.
- **Fast:** animate compositor-friendly properties, lazy-load heavy assets, no layout shift.
- **Clean:** no console errors. Types and lint pass where the stack has them. No dead code or unused dependencies.
- **Tested where logic lives:** unit-test non-trivial logic. Visual work is verified by running it and looking at it.
- **Original and credited:** original content and art unless the brief says otherwise. Credit third-party assets, fonts and libraries with their licences. Never copy a specific existing game, brand or product.
- **No secrets:** never commit keys, `.env` files, `node_modules/` or `dist/`.

## Git

The repo is `perlasoumyasri/100Missions`. Commit as `Mission NNN: <what changed>`. Push only when the user asks, and only as `perlasoumyasri`. Never as `anudeep108`, the other (active) `gh` account on this Mac. Don't switch accounts. Push with `GH_TOKEN="$(gh auth token --user perlasoumyasri)" git push origin main`.

## Writing

READMEs and posts are public. Write plainly and specifically, in short sentences, with no hype words.
