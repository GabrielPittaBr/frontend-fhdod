import { QueryClient } from '@tanstack/react-query'
import { ErroApi } from '@/lib/api/erro'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // uma nova tentativa só para falha de rede ou do servidor; 4xx não muda repetindo
      retry: (falhas, erro) => falhas < 1 && !(erro instanceof ErroApi && erro.status >= 400 && erro.status < 500),
      refetchOnWindowFocus: false,
    },
  },
})
