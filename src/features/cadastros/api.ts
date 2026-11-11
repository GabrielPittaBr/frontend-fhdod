import { comToken } from '@/features/auth/api'
import * as mock from '@/mocks/cadastros'

export type { DadosTurno } from '@/mocks/cadastros'

/** GET /categorias */
export const listarCategorias = () => comToken(async (t) => (await mock.listarCategorias(t)).data)
/** POST /categorias */
export const criarCategoria = (nome: string) => comToken(async (t) => (await mock.criarCategoria(t, { nome })).data)
/** PATCH /categorias/:id (edita ou desativa) */
export const editarCategoria = (id: number, dados: { nome?: string; ativa?: boolean }) =>
  comToken(async (t) => (await mock.editarCategoria(t, id, dados)).data)

/** GET /turnos */
export const listarTurnos = () => comToken(async (t) => (await mock.listarTurnos(t)).data)
/** POST /turnos */
export const criarTurno = (dados: mock.DadosTurno) => comToken(async (t) => (await mock.criarTurno(t, dados)).data)
/** PATCH /turnos/:id */
export const editarTurno = (id: number, dados: mock.DadosTurno) => comToken(async (t) => (await mock.editarTurno(t, id, dados)).data)
