import { comToken } from '@/features/auth/api'
import type { FiltrosRespostas } from '@/lib/api/tipos'
import * as mock from '@/mocks/consultas'

/** GET /respostas */
export const listarRespostas = (f: FiltrosRespostas) => comToken((t) => mock.listarRespostas(t, f))
/** GET /respostas/:id */
export const buscarResposta = (id: number) => comToken(async (t) => (await mock.buscarResposta(t, id)).data)
