import { comToken } from '@/features/auth/api'
import * as mock from '@/mocks/cadastros'

export type { DadosUsuario } from '@/mocks/cadastros'

/** GET /usuarios */
export const listarUsuarios = () => comToken(async (t) => (await mock.listarUsuarios(t)).data)
/** POST /usuarios (devolve a senha provisória uma única vez) */
export const criarUsuario = (dados: mock.DadosUsuario) => comToken(async (t) => (await mock.criarUsuario(t, dados)).data)
/** PATCH /usuarios/:id */
export const editarUsuario = (id: number, dados: Pick<mock.DadosUsuario, 'nome' | 'perfil'>) =>
  comToken(async (t) => (await mock.editarUsuario(t, id, dados)).data)
/** PUT /usuarios/:id/setores */
export const definirSetores = (id: number, setorIds: number[]) => comToken((t) => mock.definirSetoresDoUsuario(t, id, setorIds))
/** PATCH /usuarios/:id/status */
export const alterarStatusUsuario = (id: number, ativo: boolean) => comToken((t) => mock.alterarStatusUsuario(t, id, ativo))
/** POST /usuarios/:id/redefinir-senha */
export const redefinirSenha = (id: number) => comToken(async (t) => (await mock.redefinirSenha(t, id)).data.senhaProvisoria)
