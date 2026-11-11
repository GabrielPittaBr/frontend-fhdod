// Datas, números e telefone no formato brasileiro.
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import type { Granularidade } from '@/lib/api/tipos'

/** "AAAA-MM-DD" do dia local. */
export const isoDoDia = (data = new Date()) => format(data, 'yyyy-MM-dd')

/** 10/11/2026 */
export const dataCurta = (iso: string) => format(parseISO(iso), 'dd/MM/yyyy')

/** 10/11 */
export const diaMes = (iso: string) => format(parseISO(iso), 'dd/MM')

/** 10/11/2026 às 14:32 */
export const dataHora = (iso: string) => format(parseISO(iso), "dd/MM/yyyy 'às' HH:mm")

/** 14:32 */
export const hora = (data: Date | string) => format(typeof data === 'string' ? parseISO(data) : data, 'HH:mm')

/** terça-feira, 10 de novembro */
export const dataPorExtenso = (data: Date) => format(data, "EEEE, d 'de' MMMM", { locale: ptBR })

/** nov. de 2026 */
export const mesAno = (iso: string) => format(parseISO(iso), "MMM 'de' yyyy", { locale: ptBR })

/** "07:00" vira "7h"; "13:30" vira "13h30" */
export function horaFalada(hhmm: string) {
  const [h = '0', m = '00'] = hhmm.split(':')
  return `${Number(h)}h${m === '00' ? '' : m}`
}

export const numero = (valor: number) => valor.toLocaleString('pt-BR')

/** 4,3 */
export const decimal = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** NPS com sinal: +51, 0, −12 */
export const npsComSinal = (nps: number) => (nps > 0 ? `+${nps}` : nps < 0 ? `−${Math.abs(nps)}` : '0')

/** Máscara brasileira enquanto a pessoa digita: (51) 99999-0000 ou (51) 3333-0000. */
export function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  const corte = d.length === 11 ? 7 : 6
  return `(${d.slice(0, 2)}) ${d.slice(2, corte)}-${d.slice(corte)}`
}

/** "10/11", "semana de 09/11" ou "nov. de 2026", conforme a granularidade. */
export function rotuloDoPeriodo(periodo: string, granularidade: Granularidade, longo = false) {
  if (granularidade === 'MES') return mesAno(periodo)
  if (granularidade === 'SEMANA') return `${longo ? 'semana de ' : ''}${diaMes(periodo)}`
  return longo ? dataCurta(periodo) : diaMes(periodo)
}
