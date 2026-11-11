import type { DetalheErro } from './tipos'

/** Erro no formato padrão da API: { erro: { codigo, mensagem, detalhes, requestId } } + status HTTP. */
export class ErroApi extends Error {
  readonly status: number
  readonly codigo: string
  readonly detalhes: DetalheErro[]
  readonly requestId: string

  constructor(status: number, codigo: string, mensagem: string, detalhes: DetalheErro[] = []) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
    this.codigo = codigo
    this.detalhes = detalhes
    this.requestId = Math.random().toString(36).slice(2, 12).toUpperCase()
  }
}

/** Texto para mostrar ao usuário, sem detalhe técnico. */
export function mensagemDeErro(erro: unknown, padrao = 'Não foi possível concluir. Tente de novo.') {
  if (erro instanceof ErroApi && erro.status !== 500 && erro.status !== 0) return erro.message
  if (erro instanceof ErroApi && erro.status === 0) return 'Sem conexão. Confira a internet e tente de novo.'
  return padrao
}
