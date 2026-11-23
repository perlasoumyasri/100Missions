/** A pixel ₹1 coin used for the insert animation and the main button. */
export function PixelCoin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={`sprite ${className ?? ""}`} aria-hidden="true">
      <path d="M4 0h4v1h2v1h1v2h1v4h-1v2h-1v1h-2v1h-4v-1h-2v-1h-1v-2h-1v-4h1v-2h1v-1h2z" fill="#16131f" />
      <path d="M4 1h4v1h2v2h1v4h-1v2h-2v1h-4v-1h-2v-2h-1v-4h1v-2h2z" fill="#f5b947" />
      <path d="M4 1h4v1h-4v1h-2v1h-1v-0h1v-2h2z" fill="#ffd98a" />
      <path d="M10 6h1v2h-1v2h-2v1h-4v-1h4v-1h2z" fill="#c48a2a" />
      <path d="M4 3h4v1h-1v1h1v1h-2v1h2v1h-2v1h1v1h-2v-2h-1v-1h1v-1h-1v-1h2v-1h-2z" fill="#8a5a17" />
    </svg>
  )
}
