/**
 * Original retro sound effects, synthesised with the Web Audio API.
 *
 * Nothing is created until sound is switched on (a user gesture), and every
 * effect is a no-op when audio is unavailable. All effects share one quiet
 * master bus, so they stay soft and consistent.
 */
let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

const MASTER_VOLUME = 0.32

/** Call from a click/tap handler (e.g. turning sound on) to unlock audio. */
export function unlockAudio(): boolean {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return false
      ctx = new Ctor()
      master = ctx.createGain()
      master.gain.value = MASTER_VOLUME
      master.connect(ctx.destination)
    }
    if (ctx.state === "suspended") void ctx.resume()
    return true
  } catch {
    return false
  }
}

function ready(): AudioContext | null {
  if (!ctx || !master) return null
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  length: number,
  { type = "square" as OscillatorType, volume = 0.18, slideTo = 0, attack = 0.004 } = {},
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(master as GainNode)
  osc.start(start)
  osc.stop(start + length + 0.03)
}

function noise(ac: AudioContext, start: number, length: number, { freq = 3000, q = 4, volume = 0.2 } = {}) {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer
  const filter = ac.createBiquadFilter()
  filter.type = "bandpass"
  filter.frequency.value = freq
  filter.Q.value = q
  const gain = ac.createGain()
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  src.connect(filter).connect(gain).connect(master as GainNode)
  src.start(start)
  src.stop(start + length + 0.02)
}

export const sfx = {
  /** 6. Subtle tactile click for panel buttons. */
  press() {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    tone(ac, 1250, t, 0.035, { volume: 0.07, slideTo: 900 })
    noise(ac, t, 0.02, { freq: 4500, volume: 0.05 })
  },

  /** 1. A metallic coin dropping into the slot. */
  coin() {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    tone(ac, 1975, t, 0.09, { type: "triangle", volume: 0.16 })
    tone(ac, 2637, t + 0.05, 0.16, { type: "triangle", volume: 0.12 })
    noise(ac, t, 0.05, { freq: 6000, q: 8, volume: 0.12 })
    // Rattle as it falls inside.
    for (let i = 0; i < 3; i++) noise(ac, t + 0.12 + i * 0.045, 0.025, { freq: 2600 - i * 300, q: 10, volume: 0.07 - i * 0.015 })
  },

  /** 2. The machine wakes up: a playful ascending sequence. */
  activate() {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    ;[392, 494, 587, 784].forEach((f, i) => tone(ac, f, t + i * 0.07, 0.09, { volume: 0.09 }))
  },

  /** 3. The wheel spinning: ticks that speed up, with a rising hum. */
  spin(duration = 0.45) {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    let at = 0
    let gap = 0.07
    while (at < duration) {
      tone(ac, 820, t + at, 0.025, { type: "square", volume: 0.05 })
      at += gap
      gap = Math.max(0.03, gap * 0.85)
    }
    tone(ac, 110, t, duration, { type: "sawtooth", volume: 0.03, slideTo: 220, attack: 0.05 })
  },

  /** 4. The ticket printer: fast rhythmic clicks over a small motor. */
  print(duration = 0.45) {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    for (let at = 0; at < duration; at += 0.038) noise(ac, t + at, 0.018, { freq: 3200, q: 6, volume: 0.09 })
    tone(ac, 70, t, duration, { type: "square", volume: 0.025, attack: 0.03 })
  },

  /** 5. A short magical chime when the fortune is revealed. */
  reveal() {
    const ac = ready()
    if (!ac) return
    const t = ac.currentTime
    ;[1047, 1319, 1568, 2093].forEach((f, i) => {
      tone(ac, f, t + i * 0.06, 0.35, { type: "sine", volume: 0.12 })
      tone(ac, f * 2, t + i * 0.06, 0.12, { type: "triangle", volume: 0.03 })
    })
  },
}
