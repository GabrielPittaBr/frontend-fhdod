import { comToken } from '@/features/auth/api'
import * as mock from '@/mocks/cadastros'

export type { DadosPergunta } from '@/mocks/cadastros'

/** GET /setores/:setorId/perguntas */
export const listarPerguntas = (setorId: number) => comToken(async (t) => (await mock.listarPerguntas(t, setorId)).data)
/** POST /setores/:setorId/perguntas */
export const criarPergunta = (setorId: number, dados: mock.DadosPergunta) =>
  comToken(async (t) => (await mock.criarPergunta(t, setorId, dados)).data)
/** PATCH /perguntas/:id */
export const editarPergunta = (id: number, dados: mock.DadosPergunta) => comToken(async (t) => (await mock.editarPergunta(t, id, dados)).data)
/** PUT /setores/:setorId/perguntas/ordem */
export const salvarOrdem = (setorId: number, ids: number[]) => comToken((t) => mock.salvarOrdemDasPerguntas(t, setorId, ids))
/** PATCH /perguntas/:id/status */
export const alterarStatusPergunta = (id: number, ativa: boolean) => comToken((t) => mock.alterarStatusPergunta(t, id, ativa))
