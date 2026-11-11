import { ErroApi } from '@/lib/api/erro'
import type { DetalheErro } from '@/lib/api/tipos'

// Jeito simples de testar as telas de erro, pela URL:
//   ?falha=tudo   toda chamada falha com erro 500
//   ?falha=envio  o primeiro envio da pesquisa é gravado, mas a resposta "se perde" no caminho
// Além disso, com o navegador offline (DevTools > Network > Offline) toda chamada falha.
const parametro = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('falha')
export const falha = { tudo: parametro === 'tudo', envio: parametro === 'envio' }

/** Simula a ida ao servidor: latência de 200 a 600 ms e as falhas forçadas. */
export async function rede() {
  await new Promise((resolver) => setTimeout(resolver, 200 + Math.random() * 400))
  if (typeof navigator !== 'undefined' && !navigator.onLine) throw erros.semConexao()
  if (falha.tudo) throw new ErroApi(500, 'ERRO_INTERNO', 'Erro inesperado')
}

export const erros = {
  semConexao: () => new ErroApi(0, 'SEM_CONEXAO', 'Sem conexão'),
  validacao: (detalhes: DetalheErro[]) => new ErroApi(400, 'VALIDACAO', 'Dados inválidos', detalhes),
  naoAutenticado: (mensagem = 'Sua sessão terminou. Entre de novo.') =>
    new ErroApi(401, 'NAO_AUTENTICADO', mensagem),
  semPermissao: () => new ErroApi(403, 'SEM_PERMISSAO', 'Você não tem permissão para isso.'),
  naoEncontrado: (mensagem = 'Não encontrado.') => new ErroApi(404, 'NAO_ENCONTRADO', mensagem),
  conflito: (mensagem: string) => new ErroApi(409, 'CONFLITO', mensagem),
  muitasTentativas: () =>
    new ErroApi(429, 'LIMITE_ATINGIDO', 'Muitas tentativas. Espere 15 minutos e tente de novo.'),
}

export const tokenAleatorio = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('')
