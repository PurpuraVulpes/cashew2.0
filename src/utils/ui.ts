// ─── Petits utilitaires UI ───────────────────────────────────────────────────

export function uid(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  } catch {
    /* ignore */
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function toast(message: string): void {
  const root = document.getElementById('toast-root')
  if (!root) return
  const el = document.createElement('div')
  el.className = 'toast'
  el.setAttribute('role', 'status')
  el.textContent = message
  root.appendChild(el)
  requestAnimationFrame(() => el.classList.add('show'))
  window.setTimeout(() => {
    el.classList.remove('show')
    window.setTimeout(() => el.remove(), 350)
  }, 2400)
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** PRNG déterministe (mulberry32) pour des données de démo stables. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
