# 🚀 100 Missions

100 days. 100 missions. One project shipped every day.

Each mission is a self-contained project in its own folder, and every one gets posted on LinkedIn and X.

## 📊 Progress

**2 / 100 missions complete**

| # | Mission | Date | Tech | Post |
|---|---------|------|------|------|
| 001 | [The Fortune Machine](mission-001-design-oracle/): an 8-bit railway fortune machine ([live](https://100-missions.vercel.app/mission-001/)) | 2026-11-23 | React, TypeScript, Tailwind, 8bitcn, Web Audio | |
| 002 | [NEREID](mission-002-nereid/): a scroll-driven expedition beneath Europa's ice ([live](https://100-missions.vercel.app/mission-002/)) | 2026-11-24 | TypeScript, WebGPU (vgpu), WGSL, Web Audio, ElevenLabs | |

## 📁 Structure

Each mission is an independent project with its own idea, art direction, stack and dependencies. They share a workflow and a quality bar, not a style.

```
100Missions/
├── CLAUDE.md              ← shared workflow and engineering standards
├── .claude/skills/        ← design, art direction, animation, library discovery, visual quality, shipping
├── learnings.md           ← reusable discoveries from every mission
├── _template/             ← starting files for a new mission
├── mission-001-<name>/
│   ├── CLAUDE.md          ← this mission's instructions, stack and decisions
│   ├── brief.md           ← what and why
│   ├── art-direction.md   ← how it looks, moves and sounds
│   ├── references/        ← reference images and sources
│   ├── README.md          ← what it is, how to run it, what I learned
│   └── ...                ← the project's code
├── hub/                   ← the mission board site
├── site/                  ← each shipped mission's built website (built once, on ship)
└── scripts/               ← new-mission scaffold, per-mission build, site assembly
```

Start a new mission with `npm run new -- <number> <slug> "<Title>"`, then open Claude Code inside that mission's folder.

## 🔗 Follow along

- LinkedIn: *add your link*
- X: *add your link*
