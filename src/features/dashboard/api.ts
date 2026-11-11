// Leituras do dashboard e exportação. Quando a API existir, só este arquivo muda.
import { comToken } from '@/features/auth/api'
import type { FiltrosDashboard, Granularidade, TipoComentario } from '@/lib/api/tipos'
import * as mock from '@/mocks/consultas'

/** GET /dashboard/resumo */
export const buscarResumo = (f: FiltrosDashboard) => comToken(async (t) => (await mock.resumo(t, f)).data)
/** GET /dashboard/nps-por-setor */
export const buscarNpsPorSetor = (f: FiltrosDashboard) => comToken(async (t) => (await mock.npsPorSetor(t, f)).data)
/** GET /dashboard/evolucao */
export const buscarEvolucao = (f: FiltrosDashboard, granularidade: Granularidade) =>
  comToken(async (t) => (await mock.evolucao(t, f, granularidade)).data)
/** GET /dashboard/categorias */
export const buscarCategorias = (f: FiltrosDashboard) => comToken(async (t) => (await mock.categorias(t, f)).data)
/** GET /dashboard/ranking */
export const buscarRanking = (f: FiltrosDashboard) => comToken(async (t) => (await mock.ranking(t, f)).data)
/** GET /dashboard/comentarios */
export const buscarComentarios = (f: FiltrosDashboard, tipo?: TipoComentario) =>
  comToken((t) => mock.comentarios(t, { ...f, tipo }))

/** GET /exportacoes/resumo.xlsx (no mock, um CSV que o Excel abre) */
export const exportarResumo = (f: FiltrosDashboard) => comToken((t) => mock.exportarResumo(t, f))
/** GET /exportacoes/respostas.xlsx */
export const exportarRespostas = (f: FiltrosDashboard) => comToken((t) => mock.exportarRespostas(t, f))
