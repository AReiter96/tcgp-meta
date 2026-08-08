import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { loadTcgpCards, syncTcgpCards } from '../lib/db/sync'
import type { CardRecord } from '../lib/tcgdex/types'

export const tcgpCardsQueryKey = ['tcgp-cards'] as const

export function useCards() {
  const queryClient = useQueryClient()

  const query = useQuery<CardRecord[]>({
    queryKey: tcgpCardsQueryKey,
    queryFn: () => loadTcgpCards(),
  })

  const refreshMutation = useMutation({
    mutationFn: syncTcgpCards,
    onSuccess: (records) => {
      queryClient.setQueryData(tcgpCardsQueryKey, records)
    },
  })

  return {
    cards: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    refresh: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    refreshError: refreshMutation.isError ? refreshMutation.error : null,
  }
}
