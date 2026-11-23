// Renders the mission board from /missions.json (written by scripts/build-site.mjs).
const pad = (n) => String(n).padStart(3, "0")

const LOCK = `<svg viewBox="0 0 12 12" aria-hidden="true"><path fill="currentColor" d="M3 5V3.5a3 3 0 0 1 6 0V5h1v7H2V5h1Zm1.5 0h3V3.5a1.5 1.5 0 0 0-3 0V5Z"/></svg>`

function el(tag, attrs = {}, html = "") {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  node.innerHTML = html
  return node
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])

async function main() {
  const res = await fetch("/missions.json", { cache: "no-cache" })
  const { total, missions } = await res.json()
  const byNumber = new Map(missions.map((m) => [m.number, m]))
  const shipped = missions.length
  const nextNumber = Math.min(total, Math.max(0, ...missions.map((m) => m.number)) + 1)

  // Hero + progress
  document.getElementById("day-label").textContent = `Day ${Math.max(1, shipped)} / ${total}`
  document.getElementById("progress-label").textContent = `${shipped} of ${total} shipped`
  document.getElementById("footer-count").textContent = `${shipped}/${total} unlocked`
  const track = document.getElementById("progress-track")
  for (let i = 1; i <= total; i++) track.appendChild(el("span", byNumber.has(i) ? { class: "on" } : {}))

  // Latest mission
  const latest = [...missions].sort((a, b) => b.number - a.number)[0]
  if (latest) {
    document.getElementById("latest").hidden = false
    document.getElementById("feature").href = `/${latest.slug}/`
    document.getElementById("feature-num").textContent = `MISSION ${pad(latest.number)} · ${latest.date}`
    document.getElementById("feature-title").textContent = latest.title
    document.getElementById("feature-tagline").textContent = latest.tagline
    const img = document.getElementById("feature-img")
    if (latest.thumb) img.src = `/${latest.thumb}`
    else img.remove()
    const tags = document.getElementById("feature-tags")
    for (const t of latest.tags) tags.appendChild(el("li", {}, escapeHtml(t)))
  }

  // Board
  const board = document.getElementById("board")
  for (let i = 1; i <= total; i++) {
    const m = byNumber.get(i)
    if (m) {
      const tile = el("li", { class: "tile done" })
      tile.innerHTML = `
        <a href="/${m.slug}/" aria-label="Mission ${pad(i)}: ${escapeHtml(m.title)}">
          ${m.thumb ? `<img src="/${m.thumb}" alt="" loading="lazy" />` : ""}
          <span class="tile-num">${pad(i)}</span>
          <span class="tile-title">${escapeHtml(m.title)}</span>
        </a>`
      board.appendChild(tile)
    } else if (i === nextNumber) {
      board.appendChild(
        el(
          "li",
          { class: "tile next", "aria-label": `Mission ${pad(i)}: up next` },
          `<span class="tile-num">${pad(i)}</span><span class="tile-status"><i></i>Next</span>`,
        ),
      )
    } else {
      board.appendChild(
        el("li", { class: "tile locked", "aria-label": `Mission ${pad(i)}: locked` }, `<span class="tile-num">${pad(i)}</span>${LOCK}`),
      )
    }
  }
}

main().catch((err) => {
  console.error(err)
  document.getElementById("board").innerHTML = `<li class="mono">Couldn't load missions.</li>`
})
