import { comToken } from '@/features/auth/api'
import * as cadastros from '@/mocks/cadastros'
import { indicadoresTv } from '@/mocks/consultas'

/** GET /tv/indicadores, autenticado pelo token da tela (o que vem depois do # na URL). */
export const buscarIndicadoresTv = async (tokenDaTela: string) => (await indicadoresTv(tokenDaTela)).data

/** GET /tv-telas */
export const listarTelas = () => comToken(async (t) => (await cadastros.listarTelasTv(t)).data)
/** POST /tv-telas (devolve o token uma única vez) */
export const criarTela = (nome: string) => comToken(async (t) => (await cadastros.criarTelaTv(t, { nome })).data)
/** PATCH /tv-telas/:id/status */
export const alterarStatusTela = (id: number, ativa: boolean) => comToken((t) => cadastros.alterarStatusTelaTv(t, id, ativa))
