/**
 * Tiny original 8-bit sounds made with the Web Audio API.
 * Nothing plays until the user turns sound on.
 */
let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

function blip(ac: AudioContext, freq: number, start: number, length: number, volume = 0.06, type: OscillatorType = "square") {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

/** Rising shimmer while the crystal ball warms up. */
export function playThinking() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  ;[392, 440, 494, 523, 587, 659].forEach((f, i) => blip(ac, f, t + i * 0.09, 0.08, 0.025, "triangle"))
}

/** A bright arpeggio chime when the fortune appears. */
export function playReveal() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  ;[784, 988, 1175, 1568].forEach((f, i) => blip(ac, f, t + i * 0.07, 0.22, 0.05))
}

/** Short click for small UI actions. */
export function playClick() {
  const ac = audio()
  if (!ac) return
  blip(ac, 660, ac.currentTime, 0.05, 0.03)
}
