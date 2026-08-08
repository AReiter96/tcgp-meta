import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Kartendaten aendern sich selten -- lange staleTime, Sync-Logik in
      // lib/db/sync.ts entscheidet ueber Dexie-Cache vs. TCGdex-Nachladen.
      staleTime: 1000 * 60 * 60 * 24,
      retry: 1,
    },
  },
})
