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
