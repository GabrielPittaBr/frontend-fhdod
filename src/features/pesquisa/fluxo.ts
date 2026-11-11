// Estado da pesquisa: uma sequência simples de etapas. Fica só na memória (useReducer),
// nunca em localStorage, sessionStorage ou URL: o próximo paciente não vê nada do anterior.
import type { Canal, Complemento, EnvioResposta, ItemEnvio, RespostaCriada, Turno } from '@/lib/api/tipos'

export type Etapa = 'abertura' | 'data' | 'turno' | 'pergunta' | 'nps' | 'comentario' | 'contato' | 'agradecimento'
export type Comentario = NonNullable<Complemento['comentario']>

export interface EstadoFluxo {
  etapa: Etapa
  /** posição da pergunta atual */
  indice: number
  perguntaIds: number[]
  /** totem: data e turno já vêm prontos e as duas telas não aparecem */
  semDataTurno: boolean
  dataAtendimento: string | null
  turnoId: number | null
  /** perguntaId → resposta. Pergunta pulada não entra aqui. */
  respostas: Record<number, ItemEnvio>
  nps: number | null
  /** gerada no início de cada pesquisa e reaproveitada se o envio falhar */
  chaveIdempotencia: string
  /** o que a API devolveu ao gravar; a classificação vem pronta de lá */
  criada: RespostaCriada | null
  comentario: Comentario | null
}

export type AcaoFluxo =
  | { tipo: 'COMECAR'; atendimento?: { dataAtendimento: string; turnoId: number } }
  | { tipo: 'DEFINIR_DATA'; dataAtendimento: string }
  | { tipo: 'DEFINIR_TURNO'; turnoId: number }
  | { tipo: 'RESPONDER'; item: ItemEnvio }
  | { tipo: 'PULAR' }
  | { tipo: 'VOLTAR' }
  | { tipo: 'SELECIONAR_NPS'; nps: number }
  | { tipo: 'ENVIADA'; criada: RespostaCriada }
  | { tipo: 'COMENTAR'; comentario: Comentario | null }
  | { tipo: 'CONCLUIR' }
  | { tipo: 'REINICIAR'; chaveIdempotencia: string }

export const estadoInicial = (perguntaIds: number[], chaveIdempotencia: string): EstadoFluxo => ({
  etapa: 'abertura',
  indice: 0,
  perguntaIds,
  semDataTurno: false,
  dataAtendimento: null,
  turnoId: null,
  respostas: {},
  nps: null,
  chaveIdempotencia,
  criada: null,
  comentario: null,
})

/** Vai para a pergunta pedida ou, se as perguntas acabaram, para a nota de recomendação. */
const irPara = (e: EstadoFluxo, indice: number): EstadoFluxo =>
  indice < e.perguntaIds.length
    ? { ...e, etapa: 'pergunta', indice }
    : { ...e, etapa: 'nps', indice: e.perguntaIds.length }

const antesDasPerguntas = (e: EstadoFluxo): EstadoFluxo => ({ ...e, etapa: e.semDataTurno ? 'abertura' : 'turno' })

export function redutor(e: EstadoFluxo, acao: AcaoFluxo): EstadoFluxo {
  switch (acao.tipo) {
    case 'COMECAR':
      if (e.etapa !== 'abertura') return e
      return acao.atendimento
        ? irPara({ ...e, ...acao.atendimento, semDataTurno: true }, 0)
        : { ...e, etapa: 'data' }

    case 'DEFINIR_DATA':
      return e.etapa === 'data' ? { ...e, dataAtendimento: acao.dataAtendimento, etapa: 'turno' } : e

    case 'DEFINIR_TURNO':
      return e.etapa === 'turno' ? irPara({ ...e, turnoId: acao.turnoId }, 0) : e

    case 'RESPONDER':
      if (e.etapa !== 'pergunta' || acao.item.perguntaId !== e.perguntaIds[e.indice]) return e
      return irPara({ ...e, respostas: { ...e.respostas, [acao.item.perguntaId]: acao.item } }, e.indice + 1)

    case 'PULAR': {
      if (e.etapa !== 'pergunta') return e
      // pular também descarta uma resposta dada antes: pergunta pulada não vai no envio
      const { [e.perguntaIds[e.indice]!]: _pulada, ...respostas } = e.respostas
      return irPara({ ...e, respostas }, e.indice + 1)
    }

    case 'VOLTAR':
      if (e.etapa === 'data') return { ...e, etapa: 'abertura' }
      if (e.etapa === 'turno') return { ...e, etapa: 'data' }
      if (e.etapa === 'pergunta' || e.etapa === 'nps') return e.indice > 0 ? irPara(e, e.indice - 1) : antesDasPerguntas(e)
      // depois do envio só dá para voltar do telefone ao comentário
      if (e.etapa === 'contato') return { ...e, etapa: 'comentario' }
      return e

    case 'SELECIONAR_NPS':
      return e.etapa === 'nps' && Number.isInteger(acao.nps) && acao.nps >= 0 && acao.nps <= 10
        ? { ...e, nps: acao.nps }
        : e

    case 'ENVIADA':
      // só existe complemento depois que a nota foi gravada
      return e.etapa === 'nps' && e.nps !== null ? { ...e, criada: acao.criada, etapa: 'comentario' } : e

    case 'COMENTAR':
      // avaliação baixa: guarda o comentário e oferece o retorno por telefone
      return e.etapa === 'comentario' && e.criada && e.criada.classificacao !== 'NORMAL'
        ? { ...e, comentario: acao.comentario, etapa: 'contato' }
        : e

    case 'CONCLUIR':
      return e.criada ? { ...e, etapa: 'agradecimento' } : e

    case 'REINICIAR':
      return estadoInicial(e.perguntaIds, acao.chaveIdempotencia)
  }
}

/** Corpo do envio. Sem a nota de recomendação não há envio: é a única resposta obrigatória. */
export function montarEnvio(e: EstadoFluxo, canal: Canal): EnvioResposta | null {
  if (e.nps === null || e.dataAtendimento === null || e.turnoId === null) return null
  return {
    chaveIdempotencia: e.chaveIdempotencia,
    canal,
    dataAtendimento: e.dataAtendimento,
    turnoId: e.turnoId,
    itens: e.perguntaIds.flatMap((id) => e.respostas[id] ?? []),
    nps: e.nps,
  }
}

/** Proporção já percorrida (0 a 1), sem revelar quantas perguntas existem. */
export function progresso(e: EstadoFluxo): number {
  const antes = e.semDataTurno ? 0 : 2
  const total = antes + e.perguntaIds.length + 1
  if (e.criada) return 1
  if (e.etapa === 'abertura' || e.etapa === 'data') return 0
  if (e.etapa === 'turno') return 1 / total
  return (antes + e.indice) / total
}

/** Totem: o turno em andamento agora, inclusive o que atravessa a meia-noite. */
export function turnoDoHorario(turnos: Pick<Turno, 'id' | 'horaInicio' | 'horaFim'>[], agora: Date): number {
  const emMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
  const minuto = agora.getHours() * 60 + agora.getMinutes()
  const atual = turnos.find((t) => {
    const inicio = emMinutos(t.horaInicio)
    const fim = emMinutos(t.horaFim)
    return inicio < fim ? minuto >= inicio && minuto < fim : minuto >= inicio || minuto < fim
  })
  return (atual ?? turnos[0])?.id ?? 0
}

/** crypto.randomUUID() só existe em HTTPS ou localhost; o plano B monta um UUID v4 na mão. */
export function novaChave(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6]! & 0x0f) | 0x40
  bytes[8] = (bytes[8]! & 0x3f) | 0x80
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
