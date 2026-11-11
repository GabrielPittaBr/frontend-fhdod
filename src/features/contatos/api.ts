import { comToken } from '@/features/auth/api'
import * as mock from '@/mocks/consultas'

/** GET /contatos */
export const listarContatos = () => comToken(async (t) => (await mock.listarContatos(t)).data)
/** POST /contatos/:id/revelar-telefone (a API registra quem revelou) */
export const revelarTelefone = (id: number) => comToken(async (t) => (await mock.revelarTelefone(t, id)).data.telefone)
