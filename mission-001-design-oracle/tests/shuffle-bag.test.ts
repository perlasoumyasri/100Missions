// Run with: pnpm test   (plain Node, no test framework needed)
import assert from "node:assert/strict"
import { test } from "node:test"

import { ShuffleBag } from "../src/lib/shuffle-bag.ts"

const items = Array.from({ length: 15 }, (_, i) => i)

test("every item appears exactly once per round, for many rounds", () => {
  const bag = new ShuffleBag(items)
  for (let round = 0; round < 200; round++) {
    const seen = Array.from({ length: items.length }, () => bag.next())
    assert.deepEqual([...seen].sort((a, b) => a - b), items)
  }
})

test("never repeats the same item twice in a row, even across reshuffles", () => {
  const bag = new ShuffleBag(items)
  let prev = bag.next()
  for (let i = 0; i < 5000; i++) {
    const next = bag.next()
    assert.notEqual(next, prev)
    prev = next
  }
})

test("avoid argument skips an item from another bag without losing it", () => {
  const bag = new ShuffleBag(items)
  for (let round = 0; round < 200; round++) {
    const avoid = round % items.length
    const first = bag.next(avoid)
    assert.notEqual(first, avoid)
    const rest = Array.from({ length: items.length - 1 }, () => bag.next())
    assert.deepEqual([first, ...rest].sort((a, b) => a - b), items)
  }
})

test("a single-item bag still works", () => {
  const bag = new ShuffleBag(["only"])
  assert.equal(bag.next(), "only")
  assert.equal(bag.next(), "only")
})
