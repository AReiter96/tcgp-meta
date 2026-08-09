import { getLimitlessRateLimitInfo, LimitlessApiError } from './client'

export interface RetryOptions {
  maxRetries?: number
  defaultBackoffMs?: number
}

function isRetryable(error: unknown): boolean {
  if (!(error instanceof LimitlessApiError)) {
    // Netzwerkfehler o.ae. ohne bekannten Status -- konservativ retrybar,
    // da typischerweise transient (im Unterschied zu z.B. 404).
    return true
  }
  return error.status === 429 || error.status >= 500
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retried einen einzelnen Limitless-Request bei transienten Fehlern (429,
 * 5xx, Netzwerkfehler) -- NICHT bei z.B. 404, wo ein erneuter Versuch
 * zwecklos ist. Nutzt den `Retry-After`-Header (via getLimitlessRateLimitInfo,
 * von client.ts nach jedem Response befuellt) falls vorhanden, sonst
 * steigenden Default-Backoff. Nach Ausschoepfen der Retries wird der
 * urspruengliche Fehler weitergeworfen -- kein stiller Teildatensatz, der
 * bestehende sichtbare Fehlerzustand (siehe Tierlist/Matchups-Seiten) bleibt
 * erhalten.
 */
export async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 2
  const defaultBackoffMs = options?.defaultBackoffMs ?? 1000

  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries || !isRetryable(error)) {
        throw error
      }

      const info = getLimitlessRateLimitInfo()
      const retryAfterSeconds = info?.retryAfter ? Number(info.retryAfter) : NaN
      const waitMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : defaultBackoffMs * 2 ** attempt

      await wait(waitMs)
    }
  }
  throw lastError
}
