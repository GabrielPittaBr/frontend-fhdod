// Chamadas de autenticação. Quando a API existir, só este arquivo muda (openapi-fetch).
import { ErroApi } from '@/lib/api/erro'
import type { Sessao } from '@/lib/api/tipos'
import * as mock from '@/mocks/auth'
import { restaurarDados } from '@/mocks/cadastros'
import { useSessao } from '@/stores/sessao'

let renovando: Promise<string> | null = null

async function renovarToken() {
  const { data } = await mock.refresh()
  useSessao.getState().definirToken(data.tokenAcesso)
  return data.tokenAcesso
}

/**
 * Envia o token de acesso e, num 401, renova a sessão uma única vez e repete a chamada.
 * Todas as features do painel passam por aqui.
 */
export async function comToken<T>(chamada: (token: string) => Promise<T>): Promise<T> {
  try {
    return await chamada(useSessao.getState().token ?? '')
  } catch (erro) {
    if (!(erro instanceof ErroApi) || erro.status !== 401) throw erro
    try {
      renovando ??= renovarToken().finally(() => (renovando = null))
      return await chamada(await renovando)
    } catch (erroAoRenovar) {
      if (erroAoRenovar instanceof ErroApi && erroAoRenovar.status === 401) useSessao.getState().limpar()
      throw erroAoRenovar
    }
  }
}

async function carregarSessao(token: string) {
  const { data } = await mock.me(token)
  useSessao.getState().definir(token, data)
  return data
}

/** POST /auth/login + GET /auth/me */
export async function entrar(email: string, senha: string): Promise<Sessao> {
  const { data } = await mock.login(email, senha)
  return carregarSessao(data.tokenAcesso)
}

/** Ao recarregar a página: POST /auth/refresh + GET /auth/me. Devolve null se não há sessão. */
export async function recuperarSessao(): Promise<Sessao | null> {
  try {
    return await carregarSessao(await renovarToken())
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 401) return null
    throw erro
  }
}

/** POST /auth/logout */
export async function sair() {
  const { token, limpar } = useSessao.getState()
  try {
    if (token) await mock.logout(token)
  } finally {
    limpar()
  }
}

/** PATCH /auth/senha */
export async function trocarSenha(corpo: { senhaAtual: string; novaSenha: string }) {
  await comToken((token) => mock.trocarSenha(token, corpo))
  await carregarSessao(useSessao.getState().token ?? '')
}

/** Só enquanto for mock: atalhos de demonstração da tela de login. */
export const listarAcessosDemo = () => mock.acessosDemo()

/** Só enquanto for mock: volta aos dados iniciais (ação do menu do Super Admin). */
export const restaurarDadosDemo = () => comToken((token) => restaurarDados(token))
