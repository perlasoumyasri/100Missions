/**
 * A shuffle bag: every item is drawn once before any repeats.
 * When the bag runs dry it is refilled and reshuffled, and the first
 * item of the new round is never the item that was just drawn.
 */
export class ShuffleBag<T> {
  private bag: T[] = []
  private last: T | undefined
  private readonly items: readonly T[]
  private readonly random: () => number

  constructor(items: readonly T[], random: () => number = Math.random) {
    this.items = items
    this.random = random
  }

  /**
   * Draws the next item. `avoid` (e.g. the fortune currently on screen, which may
   * have come from a different bag) is never returned when another item is available.
   * It is kept in the bag, so no item is skipped for the round.
   */
  next(avoid: T | undefined = this.last): T {
    if (this.bag.length === 0) this.refill(avoid)
    const end = this.bag.length - 1
    if (end > 0 && this.bag[end] === avoid) {
      ;[this.bag[end], this.bag[0]] = [this.bag[0], this.bag[end]]
    }
    const item = this.bag.pop() as T
    this.last = item
    return item
  }

  private refill(avoid: T | undefined) {
    const bag = [...this.items]
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1))
      ;[bag[i], bag[j]] = [bag[j], bag[i]]
    }
    // Items are popped from the end, so the end is drawn next.
    const end = bag.length - 1
    if (end > 0 && bag[end] === avoid) {
      ;[bag[end], bag[0]] = [bag[0], bag[end]]
    }
    this.bag = bag
  }
}
