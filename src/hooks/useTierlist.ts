import { useQuery } from '@tanstack/react-query'
import { loadTierlistData } from '../lib/tierlist/loadTierlist'

export const tierlistQueryKey = ['limitless-tierlist'] as const

export function useTierlist() {
  const query = useQuery({
    queryKey: tierlistQueryKey,
    queryFn: () => loadTierlistData(),
    // Turnierergebnisse selbst aendern sich nicht mehr, aber welche N
    // Turniere "aktuell" sind verschiebt sich im Laufe des Tages -- kuerzer
    // als der globale Default (24h, auf Kartendaten zugeschnitten).
    staleTime: 1000 * 60 * 60,
    // retry:0 statt globalem Default (1): Einzelrequest-Retry/Backoff lebt
    // seit M4 in ../lib/limitless/retry.ts. Der globale QueryClient-Retry
    // wuerde sonst zusaetzlich den GESAMTEN Ladevorgang (bis zu 15 Requests)
    // wiederholen -- Verdopplung obendrauf statt Entlastung.
    retry: 0,
  })

  return {
    stats: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isFetching && !query.isLoading,
  }
}
