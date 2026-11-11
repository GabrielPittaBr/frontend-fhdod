import { format } from 'date-fns'
import type { Complemento, DetalheErro, Envelope, EnvioResposta, PesquisaPublica, RespostaCriada } from '@/lib/api/tipos'
import { banco, proximoId, salvar, type RespostaBanco } from './banco'
import { classificarResposta, type Limites } from './regras'
import { erros, falha, rede, tokenAleatorio } from './rede'

const TRINTA_MINUTOS = 30 * 60 * 1000
let envioJaFalhou = false

export function limites(): Limites {
  const c = banco.configuracoes
  return {
    npsBaixa: c.nps_limite_baixa,
    npsBaixissima: c.nps_limite_baixissima,
    escalaBaixa: c.escala_limite_baixa,
    escalaBaixissima: c.escala_limite_baixissima,
  }
}

function setorAtivo(slug: string) {
  const setor = banco.setores.find((s) => s.slug === slug)
  if (!setor?.ativo) throw erros.naoEncontrado('Esta pesquisa não está disponível.')
  return setor
}

/** GET /publico/setores/:slug/pesquisa */
export async function buscarPesquisa(slug: string): Promise<Envelope<PesquisaPublica>> {
  await rede()
  const setor = setorAtivo(slug)
  const c = banco.configuracoes
  return {
    data: {
      setor: { nome: setor.nome, slug: setor.slug },
      perguntas: banco.perguntas
        .filter((p) => p.setorId === setor.id && p.ativa)
        .sort((a, b) => a.ordem - b.ordem)
        .map(({ id, texto, tipo, opcoes }) => ({ id, texto, tipo, opcoes })),
      turnos: [...banco.turnos]
        .sort((a, b) => a.ordem - b.ordem)
        .map(({ id, nome, horaInicio, horaFim }) => ({ id, nome, horaInicio, horaFim })),
      npsTexto: c.nps_texto,
      textoLimiteCaracteres: c.texto_limite_caracteres,
      totem: { reinicioSegundos: c.totem_reinicio_segundos, inatividadeSegundos: c.totem_inatividade_segundos },
    },
  }
}

const criada = (r: RespostaBanco): Envelope<RespostaCriada> => ({
  data: {
    id: r.id,
    classificacao: r.classificacao,
    tokenComplemento: r.complemento!.token,
    expiraEm: r.complemento!.expiraEm,
  },
})

/** POST /publico/setores/:slug/respostas */
export async function enviarResposta(slug: string, corpo: EnvioResposta): Promise<Envelope<RespostaCriada>> {
  await rede()
  const setor = setorAtivo(slug)

  // Idempotência: a mesma chave devolve a resposta já gravada, sem criar outra.
  const repetida = banco.respostasNovas.find((r) => r.chaveIdempotencia === corpo.chaveIdempotencia)
  if (repetida) return criada(repetida)

  const detalhes: DetalheErro[] = []
  if (!Number.isInteger(corpo.nps) || corpo.nps < 0 || corpo.nps > 10) {
    detalhes.push({ campo: 'nps', mensagem: 'Obrigatório, de 0 a 10' })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(corpo.dataAtendimento) || corpo.dataAtendimento > format(new Date(), 'yyyy-MM-dd')) {
    detalhes.push({ campo: 'dataAtendimento', mensagem: 'Informe uma data que não seja futura' })
  }
  if (!banco.turnos.some((t) => t.id === corpo.turnoId)) {
    detalhes.push({ campo: 'turnoId', mensagem: 'Turno inválido' })
  }
  if (!corpo.chaveIdempotencia) detalhes.push({ campo: 'chaveIdempotencia', mensagem: 'Obrigatória' })

  const itens: RespostaBanco['itens'] = []
  for (const item of corpo.itens) {
    const pergunta = banco.perguntas.find((p) => p.id === item.perguntaId && p.setorId === setor.id && p.ativa)
    const notaValida = Number.isInteger(item.valorNumero) && item.valorNumero! >= 1 && item.valorNumero! <= 5
    const textoValido = !!item.valorTexto?.trim() && item.valorTexto.length <= banco.configuracoes.texto_limite_caracteres
    if (!pergunta || (pergunta.tipo === 'ESCALA_1_5' ? !notaValida : !textoValido)) {
      detalhes.push({ campo: `itens.${item.perguntaId}`, mensagem: 'Resposta inválida para esta pergunta' })
      continue
    }
    itens.push({
      perguntaId: pergunta.id,
      categoriaId: pergunta.categoriaId,
      perguntaTexto: pergunta.texto,
      tipo: pergunta.tipo,
      valorNumero: pergunta.tipo === 'ESCALA_1_5' ? item.valorNumero! : null,
      valorTexto: pergunta.tipo === 'ESCALA_1_5' ? null : item.valorTexto!.trim(),
    })
  }
  if (detalhes.length) throw erros.validacao(detalhes)

  const resposta: RespostaBanco = {
    id: proximoId(banco.respostasNovas, 900000),
    setorId: setor.id,
    canal: corpo.canal,
    dataAtendimento: corpo.dataAtendimento,
    turnoId: corpo.turnoId,
    nps: corpo.nps,
    classificacao: classificarResposta(
      corpo.nps,
      itens.flatMap((i) => (i.valorNumero === null ? [] : [i.valorNumero])),
      limites(),
    ),
    enviadoEm: new Date().toISOString(),
    itens,
    comentario: null,
    contato: null,
    chaveIdempotencia: corpo.chaveIdempotencia,
    // uso único, válido por 30 minutos
    complemento: { token: tokenAleatorio(), expiraEm: new Date(Date.now() + TRINTA_MINUTOS).toISOString(), usado: false },
  }
  banco.respostasNovas.push(resposta)
  salvar()

  if (falha.envio && !envioJaFalhou) {
    envioJaFalhou = true
    throw erros.semConexao() // o servidor gravou, mas o aparelho não recebeu a confirmação
  }
  return criada(resposta)
}

/** POST /publico/respostas/:id/complemento (cabeçalho X-Complemento-Token) */
export async function enviarComplemento(respostaId: number, token: string, corpo: Complemento): Promise<void> {
  // Valida e grava antes da latência: assim o envio feito ao sair da página não se perde.
  const resposta = banco.respostasNovas.find((r) => r.id === respostaId)
  const complemento = resposta?.complemento
  if (!resposta || !complemento || complemento.token !== token || complemento.usado || complemento.expiraEm < new Date().toISOString()) {
    await rede()
    throw erros.naoAutenticado('O prazo para complementar esta avaliação terminou.')
  }

  const detalhes: DetalheErro[] = []
  const texto = corpo.comentario?.texto.trim()
  if (corpo.comentario && (!texto || texto.length > banco.configuracoes.texto_limite_caracteres)) {
    detalhes.push({ campo: 'comentario.texto', mensagem: `Escreva até ${banco.configuracoes.texto_limite_caracteres} caracteres` })
  }
  const telefone = corpo.contato?.telefone.replace(/\D/g, '')
  if (corpo.contato && !/^\d{10,11}$/.test(telefone ?? '')) {
    detalhes.push({ campo: 'contato.telefone', mensagem: 'Informe o telefone com DDD' })
  }
  if (corpo.contato && corpo.contato.consentimento !== true) {
    detalhes.push({ campo: 'contato.consentimento', mensagem: 'O consentimento é obrigatório para guardar o telefone' })
  }
  if (detalhes.length) {
    await rede()
    throw erros.validacao(detalhes)
  }

  const agora = new Date().toISOString()
  if (corpo.comentario) resposta.comentario = { tipo: corpo.comentario.tipo, texto: texto! }
  if (corpo.contato) resposta.contato = { id: resposta.id, telefone: telefone!, consentimentoEm: agora }
  complemento.usado = true
  salvar()
  await rede()
}
