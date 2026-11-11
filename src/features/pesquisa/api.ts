// Rotas públicas da pesquisa. Quando a API existir, só este arquivo muda.
import type { Complemento, EnvioResposta, PesquisaPublica, RespostaCriada } from '@/lib/api/tipos'
import * as mock from '@/mocks/pesquisa'

/** GET /publico/setores/:slug/pesquisa */
export const buscarPesquisa = async (slug: string): Promise<PesquisaPublica> =>
  (await mock.buscarPesquisa(slug)).data

/** POST /publico/setores/:slug/respostas */
export const enviarResposta = async (slug: string, corpo: EnvioResposta): Promise<RespostaCriada> =>
  (await mock.enviarResposta(slug, corpo)).data

/** POST /publico/respostas/:id/complemento */
export const enviarComplemento = (respostaId: number, token: string, corpo: Complemento): Promise<void> =>
  mock.enviarComplemento(respostaId, token, corpo)
