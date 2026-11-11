// Os filtros do dashboard moram na URL: a mesma visão pode ser compartilhada
// e a exportação sai exatamente com o que está na tela.
import { startOfMonth, subDays } from 'date-fns'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Canal, FiltrosDashboard } from '@/lib/api/tipos'
import { isoDoDia } from '@/lib/format'

export const PERIODOS = {
  hoje: 'Hoje',
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  mes: 'Este mês',
  datas: 'Escolher datas',
} as const
export type Periodo = keyof typeof PERIODOS

const DIAS: Partial<Record<Periodo, number>> = { hoje: 0, '7d': 6, '30d': 29, '90d': 89 }
const ehData = (valor: string | null): valor is string => !!valor && /^\d{4}-\d{2}-\d{2}$/.test(valor)

export function lerFiltros(params: URLSearchParams): { periodo: Periodo; filtros: FiltrosDashboard } {
  const hoje = new Date()
  const pedido = params.get('periodo') ?? '30d'
  const periodo: Periodo = pedido in PERIODOS ? (pedido as Periodo) : '30d'
  let inicio = isoDoDia(periodo === 'mes' ? startOfMonth(hoje) : subDays(hoje, DIAS[periodo] ?? 29))
  let fim = isoDoDia(hoje)
  if (periodo === 'datas') {
    const [de, ate] = [params.get('inicio'), params.get('fim')]
    if (ehData(de)) inicio = de
    if (ehData(ate)) fim = ate
    if (inicio > fim) [inicio, fim] = [fim, inicio]
  }
  const canal = params.get('canal')
  return {
    periodo,
    filtros: {
      inicio,
      fim,
      base: params.get('base') === 'envio' ? 'ENVIO' : 'ATENDIMENTO',
      setorId: Number(params.get('setor')) || undefined,
      turnoId: Number(params.get('turno')) || undefined,
      canal: canal === 'WEB' || canal === 'TOTEM' ? (canal as Canal) : undefined,
    },
  }
}

export function useFiltros() {
  const [params, setParams] = useSearchParams()
  const texto = params.toString()
  const lidos = useMemo(() => lerFiltros(new URLSearchParams(texto)), [texto])

  /** null ou '' remove o filtro da URL. */
  function alterar(mudancas: Record<string, string | null>) {
    setParams(
      (atuais) => {
        const novos = new URLSearchParams(atuais)
        for (const [chave, valor] of Object.entries(mudancas)) {
          if (valor) novos.set(chave, valor)
          else novos.delete(chave)
        }
        return novos
      },
      { replace: true },
    )
  }

  return { ...lidos, params, alterar }
}
