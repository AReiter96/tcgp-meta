export interface BatchOptions {
  batchSize?: number
  delayMs?: number
}

/**
 * Verarbeitet `items` in Chunks statt eines einzigen `Promise.all`-Bursts
 * ueber alle Elemente -- entschaerft den vollen 15/30-Requests-Burst beim
 * kalten Laden von Tierlist/Matchups. Bleibt pro Chunk fail-fast (ein
 * Fehler im Chunk propagiert sofort, kein stiller Teildatensatz), wartet
 * zwischen Chunks kurz, um Bursts zu entzerren.
 */
export async function runInBatches<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options?: BatchOptions,
): Promise<R[]> {
  const batchSize = options?.batchSize ?? 4
  const delayMs = options?.delayMs ?? 300

  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize)
    const chunkResults = await Promise.all(chunk.map(fn))
    results.push(...chunkResults)

    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  return results
}
