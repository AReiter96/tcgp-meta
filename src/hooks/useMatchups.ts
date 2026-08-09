import { useQuery } from '@tanstack/react-query'
import { loadMatchupData } from '../lib/matchups/loadMatchups'

export const matchupsQueryKey = ['limitless-matchups'] as const

export function useMatchups() {
  const query = useQuery({
    queryKey: matchupsQueryKey,
    queryFn: () => loadMatchupData(),
    // gleiche Begruendung wie useTierlist: welche N Turniere "aktuell" sind
    // verschiebt sich im Laufe des Tages, kuerzer als der globale 24h-Default.
    staleTime: 1000 * 60 * 60,
    // retry:0 -- gleiche Begruendung wie useTierlist (Einzelrequest-Retry
    // lebt jetzt in ../lib/limitless/retry.ts, kein doppelter Batch-Retry).
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
