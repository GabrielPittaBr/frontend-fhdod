import { comToken } from '@/features/auth/api'
import * as mock from '@/mocks/cadastros'

export type { DadosSetor } from '@/mocks/cadastros'

/** GET /setores (só os que o usuário enxerga) */
export const listarSetores = () => comToken(async (t) => (await mock.listarSetores(t)).data)
/** POST /setores */
export const criarSetor = (dados: mock.DadosSetor) => comToken(async (t) => (await mock.criarSetor(t, dados)).data)
/** PATCH /setores/:id */
export const editarSetor = (id: number, dados: mock.DadosSetor) => comToken(async (t) => (await mock.editarSetor(t, id, dados)).data)
/** PATCH /setores/:id/status */
export const alterarStatusSetor = (id: number, ativo: boolean) => comToken((t) => mock.alterarStatusSetor(t, id, ativo))
