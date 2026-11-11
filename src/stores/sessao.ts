// Sessão do painel: só em memória. Ao recarregar, é recuperada pelo refresh (features/auth).
import { create } from 'zustand'
import type { Permissao, Sessao } from '@/lib/api/tipos'

interface EstadoSessao {
  token: string | null
  sessao: Sessao | null
  definir: (token: string, sessao: Sessao) => void
  definirToken: (token: string) => void
  limpar: () => void
}

export const useSessao = create<EstadoSessao>((set) => ({
  token: null,
  sessao: null,
  definir: (token, sessao) => set({ token, sessao }),
  definirToken: (token) => set({ token }),
  limpar: () => set({ token: null, sessao: null }),
}))

/** Menus e rotas dependem da lista de permissões do /auth/me, nunca do nome do perfil. */
export const usePode = (...permissoes: Permissao[]) =>
  useSessao((s) => permissoes.some((p) => s.sessao?.permissoes.includes(p)))
