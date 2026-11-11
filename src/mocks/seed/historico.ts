// Gera alguns meses de respostas com semente fixa por dia: o mesmo dia do
// calendário produz sempre as mesmas respostas, então os números não mudam a cada carga.
import { addDays, differenceInCalendarDays, format, startOfDay } from 'date-fns'
import type { Canal, TipoComentario } from '@/lib/api/tipos'
import type { RespostaBanco } from '../banco'
import { classificarResposta } from '../regras'
import { CAT, COMENTARIOS, ELOGIOS_A_PROFISSIONAIS, PERGUNTAS } from './dados'

const DIAS = 120

function mulberry32(semente: number) {
  let a = semente
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return h >>> 0
}

type Sorteio = () => number
const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const escolher = <T>(r: Sorteio, itens: readonly T[]): T => itens[Math.floor(r() * itens.length)] as T

function escolherPorPeso<T>(r: Sorteio, opcoes: readonly (readonly [T, number])[]): T {
  let alvo = r() * opcoes.reduce((soma, [, peso]) => soma + peso, 0)
  for (const [valor, peso] of opcoes) if ((alvo -= peso) < 0) return valor
  return opcoes[opcoes.length - 1]![0]
}

function poisson(r: Sorteio, media: number) {
  const limite = Math.exp(-media)
  let k = 0
  let produto = 1
  do {
    k++
    produto *= r()
  } while (produto > limite)
  return k - 1
}

interface PerfilSetor {
  /** respostas por dia útil */
  volume: number
  fimDeSemana: number
  /** 0 a 1: satisfação média do setor */
  qualidade: number
  /** quanto a qualidade muda do início ao fim do histórico */
  tendencia: number
  totem: number
  turnos: readonly (readonly [number, number])[]
  /** pontos fortes e fracos por categoria */
  vies: Partial<Record<number, number>>
}

const PERFIS: Record<number, PerfilSetor> = {
  1: { volume: 3, fimDeSemana: 1.1, qualidade: 0.66, tendencia: 0.08, totem: 0.6, turnos: [[1, 36], [2, 36], [3, 28]], vies: { [CAT.ESPERA]: -0.27, [CAT.TRIAGEM]: -0.04, [CAT.ENFERMAGEM]: 0.08, [CAT.MEDICO]: 0.06 } },
  2: { volume: 1.5, fimDeSemana: 0.8, qualidade: 0.8, tendencia: 0, totem: 0.3, turnos: [[1, 50], [2, 35], [3, 15]], vies: { [CAT.ESTRUTURA]: -0.16, [CAT.ENFERMAGEM]: 0.1, [CAT.MEDICO]: 0.05 } },
  3: { volume: 1.4, fimDeSemana: 0.3, qualidade: 0.8, tendencia: 0.02, totem: 0.5, turnos: [[1, 55], [2, 42], [3, 3]], vies: { [CAT.ESPERA]: -0.05, [CAT.ENFERMAGEM]: 0.08, [CAT.ESTRUTURA]: -0.04 } },
  4: { volume: 1.3, fimDeSemana: 0.3, qualidade: 0.82, tendencia: 0, totem: 0.45, turnos: [[1, 75], [2, 25]], vies: { [CAT.ESPERA]: -0.1, [CAT.ENFERMAGEM]: 0.1, [CAT.HIGIENE]: 0.06 } },
  5: { volume: 1.6, fimDeSemana: 0.1, qualidade: 0.76, tendencia: -0.03, totem: 0.4, turnos: [[1, 50], [2, 50]], vies: { [CAT.ESPERA]: -0.18, [CAT.RECEPCAO]: -0.03, [CAT.MEDICO]: 0.1 } },
}

const HORAS_DO_TURNO: Record<number, readonly [number, number]> = { 1: [7, 13], 2: [13, 19], 3: [19, 24] }
const INICIO_DOS_IDS = new Date(2025, 0, 1)

export function gerarHistorico(hoje = new Date()): RespostaBanco[] {
  const respostas: RespostaBanco[] = []
  const agora = hoje.getTime()

  for (let atras = DIAS; atras >= 1; atras--) {
    const dia = addDays(startOfDay(hoje), -atras)
    const dataAtendimento = format(dia, 'yyyy-MM-dd')
    const r = mulberry32(hash(`fhdod:${dataAtendimento}`))
    const fimDeSemana = dia.getDay() === 0 || dia.getDay() === 6
    const progresso = 1 - atras / DIAS
    let sequencia = differenceInCalendarDays(dia, INICIO_DOS_IDS) * 100

    for (const [chave, perfil] of Object.entries(PERFIS)) {
      const setorId = Number(chave)
      const perguntas = PERGUNTAS.filter((p) => p.setorId === setorId && p.ativa)
      const quantidade = poisson(r, perfil.volume * (fimDeSemana ? perfil.fimDeSemana : 1))

      for (let i = 0; i < quantidade; i++) {
        const turnoId = escolherPorPeso(r, perfil.turnos)
        const canal: Canal = r() < perfil.totem ? 'TOTEM' : 'WEB'

        let q = perfil.qualidade + perfil.tendencia * progresso + (r() + r() + r() - 1.5) * 0.36
        if (setorId === 1 && turnoId === 3) q -= 0.08
        if (r() < 0.05) q -= 0.45 // um dia ruim acontece em qualquer setor
        q = limitar(q, 0, 1)

        const nps = limitar(Math.round(10.6 * q ** 0.6 + (r() - 0.5) * 1.6), 0, 10)

        const itens: RespostaBanco['itens'] = []
        for (const pergunta of perguntas) {
          if (r() > (pergunta.tipo === 'TEXTO' ? 0.12 : 0.84)) continue // pulada
          const s = limitar(q + (perfil.vies[pergunta.categoriaId] ?? 0), 0, 1)
          const item = { perguntaId: pergunta.id, categoriaId: pergunta.categoriaId, perguntaTexto: pergunta.texto, tipo: pergunta.tipo }
          if (pergunta.tipo === 'ESCALA_1_5') {
            const nota = limitar(Math.round(1 + 4.4 * s ** 0.55 + (r() - 0.5) * 0.7), 1, 5)
            itens.push({ ...item, valorNumero: nota, valorTexto: null })
          } else if (pergunta.tipo === 'SIM_NAO') {
            itens.push({ ...item, valorNumero: null, valorTexto: r() < limitar(s + 0.15, 0.05, 0.97) ? 'SIM' : 'NAO' })
          } else if (pergunta.tipo === 'MULTIPLA_ESCOLHA') {
            const opcoes = pergunta.opcoes ?? []
            const indice = limitar(Math.floor((1 - s + (r() - 0.5) * 0.3) * opcoes.length), 0, opcoes.length - 1)
            itens.push({ ...item, valorNumero: null, valorTexto: opcoes[indice] ?? null })
          } else {
            itens.push({ ...item, valorNumero: null, valorTexto: escolher(r, ELOGIOS_A_PROFISSIONAIS) })
          }
        }

        const classificacao = classificarResposta(
          nps,
          itens.flatMap((item) => (item.valorNumero === null ? [] : [item.valorNumero])),
        )
        const baixa = classificacao !== 'NORMAL'

        // Totem responde na hora; pelo celular, muita gente responde à noite ou no dia seguinte.
        const [inicio, fim] = HORAS_DO_TURNO[turnoId]!
        const horaAtendimento = inicio + r() * (fim - inicio - 0.5)
        let envio = new Date(dia)
        if (canal === 'TOTEM') {
          envio.setHours(0, Math.round((horaAtendimento + 0.3) * 60))
        } else {
          const diasDepois = escolherPorPeso(r, [[0, 50], [1, 35], [2, 15]] as const)
          const hora = diasDepois === 0 ? Math.max(horaAtendimento + 1, 19 + r() * 4.5) : 8 + r() * 14
          envio = addDays(dia, diasDepois)
          envio.setHours(0, Math.round(hora * 60))
        }
        if (envio.getTime() >= agora) {
          envio = new Date(dia)
          envio.setHours(23, 30)
        }
        const enviadoEm = envio.toISOString()

        let comentario: RespostaBanco['comentario'] = null
        if (r() < (classificacao === 'BAIXISSIMA' ? 0.6 : baixa ? 0.36 : 0.24)) {
          const tipo = escolherPorPeso<TipoComentario>(
            r,
            baixa
              ? [['RECLAMACAO', 72], ['SUGESTAO', 20], ['OUTRO', 8]]
              : [['ELOGIO', 72], ['SUGESTAO', 22], ['OUTRO', 6]],
          )
          comentario = { tipo, texto: escolher(r, COMENTARIOS[tipo]) }
        }

        const id = ++sequencia
        const contato =
          baixa && r() < 0.16
            ? {
                id,
                // DDD e prefixo fictícios: nenhum destes números existe
                telefone: `5190000${String(Math.floor(r() * 10000)).padStart(4, '0')}`,
                consentimentoEm: enviadoEm,
              }
            : null

        respostas.push({ id, setorId, canal, dataAtendimento, turnoId, nps, classificacao, enviadoEm, itens, comentario, contato })
      }
    }
  }
  return respostas
}
