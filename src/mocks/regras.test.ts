import { describe, expect, it } from 'vitest'
import { calcularNps, classificarNota, classificarNps, classificarResposta, mascararTelefone, PERMISSOES_POR_PERFIL } from './regras'
import { gerarHistorico } from './seed/historico'

describe('classificação', () => {
  it('NPS: baixa até 6, baixíssima até 2', () => {
    expect([0, 2].map((n) => classificarNps(n))).toEqual(['BAIXISSIMA', 'BAIXISSIMA'])
    expect([3, 6].map((n) => classificarNps(n))).toEqual(['BAIXA', 'BAIXA'])
    expect([7, 10].map((n) => classificarNps(n))).toEqual(['NORMAL', 'NORMAL'])
  })

  it('escala 1 a 5: baixa até 3, baixíssima só no 1', () => {
    expect([1, 2, 3, 4, 5].map((n) => classificarNota(n))).toEqual(['BAIXISSIMA', 'BAIXA', 'BAIXA', 'NORMAL', 'NORMAL'])
  })

  it('vale a pior entre o NPS e as notas', () => {
    expect(classificarResposta(10, [5, 5])).toBe('NORMAL')
    expect(classificarResposta(10, [5, 3])).toBe('BAIXA')
    expect(classificarResposta(5, [5, 1])).toBe('BAIXISSIMA')
    expect(classificarResposta(1, [5, 5])).toBe('BAIXISSIMA')
    expect(classificarResposta(6, [])).toBe('BAIXA') // pulou tudo: vale só o NPS
  })

  it('respeita limites ajustados', () => {
    const limites = { npsBaixa: 7, npsBaixissima: 3, escalaBaixa: 2, escalaBaixissima: 1 }
    expect(classificarNps(7, limites)).toBe('BAIXA')
    expect(classificarNota(3, limites)).toBe('NORMAL')
  })
})

describe('cálculo do NPS', () => {
  it('% de promotores menos % de detratores', () => {
    expect(calcularNps([10, 9, 8, 7, 6, 0])).toBe(0) // 2 promotores, 2 detratores
    expect(calcularNps([10, 10, 9, 8])).toBe(75)
    expect(calcularNps([0, 6, 6])).toBe(-100)
    expect(calcularNps([7, 8])).toBe(0)
  })

  it('sem respostas não há NPS', () => {
    expect(calcularNps([])).toBeNull()
  })
})

describe('permissões e privacidade', () => {
  it('só Super Admin e Ouvidoria veem telefones', () => {
    const comTelefone = Object.entries(PERMISSOES_POR_PERFIL).flatMap(([perfil, p]) => (p.includes('contatos:ver') ? [perfil] : []))
    expect(comTelefone).toEqual(['SUPER_ADMIN', 'OUVIDORIA'])
  })

  it('visualizador não vê respostas nem comentários', () => {
    expect(PERMISSOES_POR_PERFIL.VISUALIZADOR).toEqual(['dashboard:ver', 'exportacao:resumo'])
  })

  it('telefone mascarado mostra só os 4 últimos dígitos', () => {
    expect(mascararTelefone('51900000042')).toBe('•••• 0042')
  })
})

describe('histórico gerado', () => {
  const hoje = new Date(2026, 10, 10, 12)
  const historico = gerarHistorico(hoje)

  it('é sempre o mesmo para o mesmo dia', () => {
    expect(gerarHistorico(hoje)).toEqual(historico)
  })

  it('tem volume de alguns meses, maioria positiva e uma parte baixa', () => {
    const baixas = historico.filter((r) => r.classificacao !== 'NORMAL').length / historico.length
    expect(historico.length).toBeGreaterThan(600)
    expect(historico.length).toBeLessThan(1400)
    expect(baixas).toBeGreaterThan(0.1)
    expect(baixas).toBeLessThan(0.4)
    expect(calcularNps(historico.map((r) => r.nps))).toBeGreaterThan(20)
  })

  it('não tem id repetido nem envio no futuro', () => {
    expect(new Set(historico.map((r) => r.id)).size).toBe(historico.length)
    expect(historico.every((r) => new Date(r.enviadoEm) < hoje)).toBe(true)
  })
})
