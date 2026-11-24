# Art direction: Mission 001, The Fortune Machine

*(Written after shipping, from the README and code.)*

## Concept

The coin-operated weighing machines on Indian railway platforms, seen through an old VHS tape. It doesn't weigh you. It weighs what's on your mind.

**Core feeling:** a small, playful ritual of luck.

## Mood

- **It is:** nostalgic, mechanical, cheeky, glowing, collectible.
- **It is not:** slick, corporate, serious, minimal.

## Colour

The dark variant of 8bitcn's VHS theme (oklch values converted to hex):

| Role | Value |
|---|---|
| Background | `#100c18` |
| Card / surface | `#181123` |
| Text | lavender `#e9d5ff` |
| Primary | fuchsia `#d946ef` |
| Secondary | violet `#a855f7` |
| Ring and glow | cyan `#0ea5e9` |
| Accents | teal and pink |

Colour behaves like light: bulbs glow, a soft cyan glow sits around focus, and the title has a VHS colour split.

## Typography

VT323 for everything, with 0.05rem letter spacing. A 3×5 pixel font for text drawn inside the machine art.

## Shape and texture

Chunky pixel edges everywhere (8bitcn borders). The ticket is lavender paper with grain, a double fuchsia frame and perforated notches.

## Imagery and illustration

Original pixel art drawn as SVG geometry: an octagonal head with chasing bulbs, an illuminated fortune wheel, a ₹1 coin slot, a gauge, status lamps, a ticket dispenser and a weighing platform with footprints.

**Tikku:** a tiny lavender creature in a fuchsia railway cap with a handlebar mustache, living in the machine's window. One base sprite, 13 expression frames.

## Motion personality

Mechanical and slightly stepped, like an old machine. The ritual in beats: coin flies in → machine wakes up → wheel spins → printer clicks → ticket prints and lands. Tikku reacts rather than constantly moving: he jumps at the coin, strains at the lever, then winks (Roast), looks knowing (Wisdom) or waves with star eyes (Hype). Pixel confetti for Hype.

## Sound

Six synthesised effects (coin, activation, wheel spin, printer, reveal chime, button click) through one quiet master bus. On by default, unlocked by the first click, with a mute toggle.

## Voice

Playful fortune-teller with railway flavour. "What's weighing on you today?" / "Insert a coin. The universe has opinions." Tickets read "From Overthinking → To Work & Ambition".

## Do

- Snap pixel art to whole device pixels.
- Make the ticket worth keeping.

## Don't

- Use smooth gradients or non-pixel shapes in the machine art.
- Attribute fortunes to real people.

## References

See [references/README.md](references/README.md).
