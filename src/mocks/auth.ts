import type { AcessoDemo, Envelope, Permissao, Sessao } from '@/lib/api/tipos'
import { banco, salvar, type UsuarioBanco } from './banco'
import { PERFIS_SEM_ESCOPO, PERMISSOES_POR_PERFIL } from './regras'
import { erros, rede, tokenAleatorio } from './rede'
import { TV_TELAS, USUARIOS } from './seed/dados'

const QUINZE_MINUTOS = 15 * 60 * 1000
const SETE_DIAS = 7 * 24 * 60 * 60 * 1000

// Token de acesso: só na memória desta aba, 15 min (no sistema real, um JWT).
const tokensDeAcesso = new Map<string, { usuarioId: number; expiraEm: number }>()
// Faz o papel do cookie HttpOnly de refresh. O front nunca lê esta chave.
const COOKIE = 'fhdod-mock-cookie-refresh'
const falhasDeLogin = new Map<string, number[]>()

export interface Contexto {
  usuario: UsuarioBanco
  permissoes: Permissao[]
  /** null = todos os setores */
  setorIds: number[] | null
}

export function autenticar(token: string): Contexto {
  const acesso = tokensDeAcesso.get(token)
  const usuario = acesso && banco.usuarios.find((u) => u.id === acesso.usuarioId)
  if (!acesso || acesso.expiraEm < Date.now() || !usuario?.ativo) throw erros.naoAutenticado()
  return {
    usuario,
    permissoes: PERMISSOES_POR_PERFIL[usuario.perfil],
    setorIds: PERFIS_SEM_ESCOPO.includes(usuario.perfil) ? null : usuario.setorIds,
  }
}

export function exigir(contexto: Contexto, permissao: Permissao) {
  if (!contexto.permissoes.includes(permissao)) throw erros.semPermissao()
}

export function exigirSetor(contexto: Contexto, setorId: number) {
  if (contexto.setorIds && !contexto.setorIds.includes(setorId)) throw erros.semPermissao()
}

function emitirAcesso(usuarioId: number) {
  const tokenAcesso = tokenAleatorio()
  tokensDeAcesso.set(tokenAcesso, { usuarioId, expiraEm: Date.now() + QUINZE_MINUTOS })
  return { data: { tokenAcesso } }
}

export function emitirRefresh(usuarioId: number) {
  const token = tokenAleatorio()
  banco.refreshTokens.push({ token, usuarioId, expiraEm: Date.now() + SETE_DIAS })
  localStorage.setItem(COOKIE, token)
  salvar()
}

export function revogarSessoes(usuarioId: number) {
  banco.refreshTokens = banco.refreshTokens.filter((r) => r.usuarioId !== usuarioId)
  for (const [token, acesso] of tokensDeAcesso) if (acesso.usuarioId === usuarioId) tokensDeAcesso.delete(token)
}

/** POST /auth/login */
export async function login(email: string, senha: string): Promise<Envelope<{ tokenAcesso: string }>> {
  await rede()
  const chave = email.trim().toLowerCase()
  const recentes = (falhasDeLogin.get(chave) ?? []).filter((em) => em > Date.now() - QUINZE_MINUTOS)
  if (recentes.length >= 5) throw erros.muitasTentativas()

  const usuario = banco.usuarios.find((u) => u.email.toLowerCase() === chave)
  if (!usuario || usuario.senha !== senha || !usuario.ativo) {
    falhasDeLogin.set(chave, [...recentes, Date.now()])
    throw erros.naoAutenticado('E-mail ou senha incorretos.')
  }
  falhasDeLogin.delete(chave)
  usuario.ultimoLoginEm = new Date().toISOString()
  emitirRefresh(usuario.id)
  return emitirAcesso(usuario.id)
}

/** POST /auth/refresh: troca o refresh (rotativo) e devolve um novo token de acesso. */
export async function refresh(): Promise<Envelope<{ tokenAcesso: string }>> {
  await rede()
  const cookie = localStorage.getItem(COOKIE)
  const atual = banco.refreshTokens.find((r) => r.token === cookie)
  const usuario = atual && banco.usuarios.find((u) => u.id === atual.usuarioId)
  if (!atual || atual.expiraEm < Date.now() || !usuario?.ativo) throw erros.naoAutenticado()
  banco.refreshTokens = banco.refreshTokens.filter((r) => r !== atual)
  emitirRefresh(usuario.id)
  return emitirAcesso(usuario.id)
}

/** POST /auth/logout */
export async function logout(token: string): Promise<void> {
  await rede()
  const acesso = tokensDeAcesso.get(token)
  if (acesso) revogarSessoes(acesso.usuarioId)
  localStorage.removeItem(COOKIE)
  salvar()
}

/** GET /auth/me */
export async function me(token: string): Promise<Envelope<Sessao>> {
  await rede()
  const { usuario, permissoes, setorIds } = autenticar(token)
  return {
    data: {
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, trocarSenha: usuario.trocarSenha },
      permissoes,
      setores: banco.setores.filter((s) => setorIds?.includes(s.id)).map(({ id, nome }) => ({ id, nome })),
      todosSetores: setorIds === null,
    },
  }
}

export const senhaValida = (senha: string) => senha.length >= 10 && /[a-z]/i.test(senha) && /\d/.test(senha)

/** PATCH /auth/senha */
export async function trocarSenha(token: string, corpo: { senhaAtual: string; novaSenha: string }): Promise<void> {
  await rede()
  const { usuario } = autenticar(token)
  if (usuario.senha !== corpo.senhaAtual) {
    throw erros.validacao([{ campo: 'senhaAtual', mensagem: 'A senha atual não confere.' }])
  }
  if (!senhaValida(corpo.novaSenha)) {
    throw erros.validacao([{ campo: 'novaSenha', mensagem: 'Use pelo menos 10 caracteres, com letras e números.' }])
  }
  usuario.senha = corpo.novaSenha
  usuario.trocarSenha = false
  // Troca de senha encerra as outras sessões; esta continua com um refresh novo.
  banco.refreshTokens = banco.refreshTokens.filter((r) => r.usuarioId !== usuario.id)
  emitirRefresh(usuario.id)
}

/** Só existe no mock: atalhos de demonstração da tela de login. Some quando a API chegar. */
export function acessosDemo(): { usuarios: AcessoDemo[]; links: { rotulo: string; url: string }[] } {
  const rotulos = { SUPER_ADMIN: 'Super Admin', GESTOR: 'Gestor de setor', OUVIDORIA: 'Ouvidoria', VISUALIZADOR: 'Visualizador' }
  const setor = banco.setores.find((s) => s.ativo)
  const tela = banco.tvTelas.find((t) => t.ativa && TV_TELAS.some((seed) => seed.token === t.token))
  return {
    usuarios: USUARIOS.map((u) => ({
      rotulo: u.trocarSenha ? 'Primeiro acesso' : rotulos[u.perfil],
      descricao: u.demo,
      email: u.email,
      // se a senha de demonstração foi trocada no painel, o atalho usa a atual
      senha: banco.usuarios.find((b) => b.id === u.id)?.senha ?? u.senha,
    })),
    links: [
      ...(setor
        ? [
            { rotulo: `Pesquisa do paciente (${setor.nome})`, url: `/s/${setor.slug}` },
            { rotulo: `Modo totem (${setor.nome})`, url: `/totem/${setor.slug}` },
          ]
        : []),
      ...(tela ? [{ rotulo: `TV Wall (${tela.nome})`, url: `/tv#${tela.token}` }] : []),
    ],
  }
}
