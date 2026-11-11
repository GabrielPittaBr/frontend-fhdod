import { describe, expect, it } from 'vitest'
import type { RespostaCriada } from '@/lib/api/tipos'
import { estadoInicial, montarEnvio, novaChave, progresso, redutor, turnoDoHorario, type AcaoFluxo, type EstadoFluxo } from './fluxo'

const aplicar = (estado: EstadoFluxo, ...acoes: AcaoFluxo[]) => acoes.reduce(redutor, estado)
const criada = (classificacao: RespostaCriada['classificacao']): RespostaCriada => ({
  id: 1,
  classificacao,
  tokenComplemento: 't',
  expiraEm: '2026-11-10T15:00:00Z',
})
const inicio = () => estadoInicial([11, 12, 13], 'chave-1')
const ateAsPerguntas: AcaoFluxo[] = [
  { tipo: 'COMECAR' },
  { tipo: 'DEFINIR_DATA', dataAtendimento: '2026-11-09' },
  { tipo: 'DEFINIR_TURNO', turnoId: 2 },
]

describe('etapas da pesquisa', () => {
  it('segue data, turno, perguntas e nota de recomendação', () => {
    let e = aplicar(inicio(), { tipo: 'COMECAR' })
    expect(e.etapa).toBe('data')
    e = aplicar(e, ateAsPerguntas[1]!, ateAsPerguntas[2]!)
    expect([e.etapa, e.indice]).toEqual(['pergunta', 0])
    e = aplicar(
      e,
      { tipo: 'RESPONDER', item: { perguntaId: 11, valorNumero: 4 } },
      { tipo: 'RESPONDER', item: { perguntaId: 12, valorTexto: 'SIM' } },
      { tipo: 'RESPONDER', item: { perguntaId: 13, valorNumero: 2 } },
    )
    expect(e.etapa).toBe('nps')
  })

  it('pergunta pulada não entra no envio', () => {
    const e = aplicar(
      inicio(),
      ...ateAsPerguntas,
      { tipo: 'RESPONDER', item: { perguntaId: 11, valorNumero: 5 } },
      { tipo: 'PULAR' },
      { tipo: 'PULAR' },
      { tipo: 'SELECIONAR_NPS', nps: 9 },
    )
    expect(montarEnvio(e, 'WEB')).toEqual({
      chaveIdempotencia: 'chave-1',
      canal: 'WEB',
      dataAtendimento: '2026-11-09',
      turnoId: 2,
      itens: [{ perguntaId: 11, valorNumero: 5 }],
      nps: 9,
    })
  })

  it('aceita pular todas as perguntas e responder só a nota', () => {
    const e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'SELECIONAR_NPS', nps: 0 })
    expect(montarEnvio(e, 'WEB')).toMatchObject({ itens: [], nps: 0 })
  })

  it('voltar e pular descarta a resposta dada antes', () => {
    const e = aplicar(
      inicio(),
      ...ateAsPerguntas,
      { tipo: 'RESPONDER', item: { perguntaId: 11, valorNumero: 1 } },
      { tipo: 'VOLTAR' },
      { tipo: 'PULAR' },
    )
    expect(e.respostas).toEqual({})
    expect(e.indice).toBe(1)
  })

  it('voltar refaz o caminho até a abertura', () => {
    let e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' })
    const caminho: string[] = []
    for (let i = 0; i < 5; i++) {
      e = redutor(e, { tipo: 'VOLTAR' })
      caminho.push(e.etapa)
    }
    expect(caminho).toEqual(['pergunta', 'turno', 'data', 'abertura', 'abertura'])
  })

  it('ignora resposta de uma pergunta que não é a atual (toque atrasado)', () => {
    const e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'RESPONDER', item: { perguntaId: 13, valorNumero: 3 } })
    expect([e.indice, e.respostas]).toEqual([0, {}])
  })
})

describe('nota de recomendação obrigatória', () => {
  it('sem a nota não existe envio', () => {
    const e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'PULAR' })
    expect(e.etapa).toBe('nps')
    expect(montarEnvio(e, 'WEB')).toBeNull()
    // não há "pular" na nota, e a confirmação do servidor é ignorada sem ela
    expect(redutor(e, { tipo: 'PULAR' })).toBe(e)
    expect(redutor(e, { tipo: 'ENVIADA', criada: criada('NORMAL') })).toBe(e)
    expect(redutor(e, { tipo: 'CONCLUIR' })).toBe(e)
  })

  it('só aceita notas inteiras de 0 a 10', () => {
    const e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'PULAR' })
    expect(redutor(e, { tipo: 'SELECIONAR_NPS', nps: 11 }).nps).toBeNull()
    expect(redutor(e, { tipo: 'SELECIONAR_NPS', nps: 7.5 }).nps).toBeNull()
    expect(redutor(e, { tipo: 'SELECIONAR_NPS', nps: 10 }).nps).toBe(10)
  })

  it('o caminho depois do envio depende da classificação que a API devolve', () => {
    const naNota = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'SELECIONAR_NPS', nps: 3 })
    const comentario = { tipo: 'RECLAMACAO', texto: 'Demorou' } as const

    const baixa = aplicar(naNota, { tipo: 'ENVIADA', criada: criada('BAIXA') }, { tipo: 'COMENTAR', comentario })
    expect([baixa.etapa, baixa.comentario]).toEqual(['contato', comentario])

    // avaliação normal não passa pela tela do telefone
    const normal = aplicar(naNota, { tipo: 'ENVIADA', criada: criada('NORMAL') }, { tipo: 'COMENTAR', comentario })
    expect(normal.etapa).toBe('comentario')
    expect(redutor(normal, { tipo: 'CONCLUIR' }).etapa).toBe('agradecimento')
  })

  it('depois de enviada, não dá para voltar e mudar a nota', () => {
    const e = aplicar(inicio(), ...ateAsPerguntas, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'PULAR' }, { tipo: 'SELECIONAR_NPS', nps: 8 }, { tipo: 'ENVIADA', criada: criada('NORMAL') })
    expect(redutor(e, { tipo: 'VOLTAR' })).toBe(e)
    expect(redutor(e, { tipo: 'SELECIONAR_NPS', nps: 1 })).toBe(e)
  })
})

describe('reinício (totem)', () => {
  it('apaga tudo do paciente anterior e troca a chave de idempotência', () => {
    const usado = aplicar(
      inicio(),
      { tipo: 'COMECAR', atendimento: { dataAtendimento: '2026-11-10', turnoId: 1 } },
      { tipo: 'RESPONDER', item: { perguntaId: 11, valorNumero: 2 } },
      { tipo: 'PULAR' },
      { tipo: 'PULAR' },
      { tipo: 'SELECIONAR_NPS', nps: 4 },
      { tipo: 'ENVIADA', criada: criada('BAIXA') },
      { tipo: 'COMENTAR', comentario: { tipo: 'RECLAMACAO', texto: 'Esperei muito' } },
    )
    expect(usado.etapa).toBe('contato')
    expect(redutor(usado, { tipo: 'REINICIAR', chaveIdempotencia: 'chave-2' })).toEqual(estadoInicial([11, 12, 13], 'chave-2'))
  })

  it('no totem a pesquisa começa direto nas perguntas, com data e turno prontos', () => {
    const e = aplicar(inicio(), { tipo: 'COMECAR', atendimento: { dataAtendimento: '2026-11-10', turnoId: 3 } })
    expect([e.etapa, e.dataAtendimento, e.turnoId]).toEqual(['pergunta', '2026-11-10', 3])
    expect(redutor(e, { tipo: 'VOLTAR' }).etapa).toBe('abertura')
  })
})

describe('apoio', () => {
  it('progresso cresce por proporção e fecha em 100% ao enviar', () => {
    let e = aplicar(inicio(), ...ateAsPerguntas)
    const valores = [progresso(e)]
    for (let i = 0; i < 3; i++) {
      e = redutor(e, { tipo: 'PULAR' })
      valores.push(progresso(e))
    }
    expect(valores).toEqual([2 / 6, 3 / 6, 4 / 6, 5 / 6])
    e = aplicar(e, { tipo: 'SELECIONAR_NPS', nps: 10 }, { tipo: 'ENVIADA', criada: criada('NORMAL') })
    expect(progresso(e)).toBe(1)
  })

  it('escolhe o turno pelo horário, inclusive o que atravessa a meia-noite', () => {
    const turnos = [
      { id: 1, horaInicio: '07:00', horaFim: '13:00' },
      { id: 2, horaInicio: '13:00', horaFim: '19:00' },
      { id: 3, horaInicio: '19:00', horaFim: '07:00' },
    ]
    const as = (h: number, m = 0) => turnoDoHorario(turnos, new Date(2026, 10, 10, h, m))
    expect([as(7), as(12, 59), as(13), as(18, 59), as(19), as(23, 59), as(0), as(6, 59)]).toEqual([1, 1, 2, 2, 3, 3, 3, 3])
  })

  it('gera chaves diferentes no formato UUID', () => {
    const [a, b] = [novaChave(), novaChave()]
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(a).not.toBe(b)
  })
})
