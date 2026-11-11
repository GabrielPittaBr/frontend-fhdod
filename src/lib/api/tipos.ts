// Tipos do contrato da API, escritos à mão com os mesmos nomes de campo do
// Plano de Desenvolvimento. Serão trocados pelo schema.d.ts gerado do openapi.json.

export type Perfil = 'SUPER_ADMIN' | 'GESTOR' | 'OUVIDORIA' | 'VISUALIZADOR'
export type Canal = 'WEB' | 'TOTEM'
export type Classificacao = 'NORMAL' | 'BAIXA' | 'BAIXISSIMA'
export type TipoPergunta = 'ESCALA_1_5' | 'SIM_NAO' | 'MULTIPLA_ESCOLHA' | 'TEXTO'
export type TipoComentario = 'ELOGIO' | 'RECLAMACAO' | 'SUGESTAO' | 'OUTRO'
export type BaseData = 'ATENDIMENTO' | 'ENVIO'
export type Granularidade = 'DIA' | 'SEMANA' | 'MES'

export type Permissao =
  | 'setores:gerenciar'
  | 'usuarios:gerenciar'
  | 'categorias:gerenciar'
  | 'turnos:gerenciar'
  | 'tvwall:gerenciar'
  | 'configuracoes:gerenciar'
  | 'auditoria:ver'
  | 'perguntas:gerenciar'
  | 'dashboard:ver'
  | 'respostas:ver'
  | 'comentarios:ver'
  | 'contatos:ver'
  | 'contatos:gerenciar'
  | 'exportacao:resumo'
  | 'exportacao:detalhada'
  | 'escalas:gerenciar'

export interface Envelope<T> {
  data: T
}

export interface Meta {
  pagina: number
  porPagina: number
  total: number
}

export interface Lista<T> {
  data: T[]
  meta: Meta
}

export interface DetalheErro {
  campo: string
  mensagem: string
}

// ---------- Cadastros ----------

export interface Setor {
  id: number
  nome: string
  slug: string
  descricao: string | null
  ativo: boolean
}

export interface Categoria {
  id: number
  nome: string
  ordem: number
  ativa: boolean
}

export interface Turno {
  id: number
  nome: string
  /** "HH:mm" */
  horaInicio: string
  /** "HH:mm"; menor que horaInicio quando o turno atravessa a meia-noite */
  horaFim: string
  ordem: number
}

export interface Pergunta {
  id: number
  setorId: number
  categoriaId: number
  texto: string
  tipo: TipoPergunta
  opcoes: string[] | null
  ordem: number
  ativa: boolean
  /** Com respostas gravadas, o tipo não pode mais mudar. */
  temRespostas: boolean
}

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
  ativo: boolean
  trocarSenha: boolean
  setorIds: number[]
  ultimoLoginEm: string | null
}

export interface TelaTv {
  id: number
  nome: string
  ativa: boolean
  ultimoAcessoEm: string | null
}

// ---------- Autenticação ----------

export interface Sessao {
  usuario: { id: number; nome: string; email: string; perfil: Perfil; trocarSenha: boolean }
  permissoes: Permissao[]
  /** Vazio quando o usuário enxerga todos os setores. */
  setores: { id: number; nome: string }[]
  todosSetores: boolean
}

export interface AcessoDemo {
  rotulo: string
  descricao: string
  email: string
  senha: string
}

// ---------- Pesquisa pública ----------

export interface PerguntaPublica {
  id: number
  texto: string
  tipo: TipoPergunta
  opcoes: string[] | null
}

export interface PesquisaPublica {
  setor: { nome: string; slug: string }
  perguntas: PerguntaPublica[]
  turnos: Pick<Turno, 'id' | 'nome' | 'horaInicio' | 'horaFim'>[]
  npsTexto: string
  textoLimiteCaracteres: number
  totem: { reinicioSegundos: number; inatividadeSegundos: number }
}

export interface ItemEnvio {
  perguntaId: number
  valorNumero?: number
  valorTexto?: string
}

export interface EnvioResposta {
  chaveIdempotencia: string
  canal: Canal
  /** "AAAA-MM-DD": dia do atendimento, não do envio */
  dataAtendimento: string
  turnoId: number
  itens: ItemEnvio[]
  nps: number
}

export interface RespostaCriada {
  id: number
  classificacao: Classificacao
  tokenComplemento: string
  expiraEm: string
}

export interface Complemento {
  comentario?: { tipo: TipoComentario; texto: string }
  contato?: { telefone: string; consentimento: true }
}

// ---------- Painel ----------

export interface FiltrosDashboard {
  inicio: string
  fim: string
  base: BaseData
  setorId?: number
  turnoId?: number
  canal?: Canal
}

export interface Resumo {
  nps: number | null
  total: number
  promotores: number
  neutros: number
  detratores: number
  notasBaixas: number
  baixissimas: number
  /** Média das notas de 1 a 5 de todas as perguntas respondidas. */
  mediaEscala: number | null
}

export interface NpsSetor {
  setorId: number
  setor: string
  nps: number | null
  total: number
}

export interface PontoEvolucao {
  /** Primeiro dia do período ("AAAA-MM-DD"). */
  periodo: string
  nps: number | null
  total: number
}

export interface IndicadorCategoria {
  categoriaId: number
  categoria: string
  media: number | null
  /** % de notas 4 e 5 */
  percentual45: number | null
  total: number
}

export interface ItemRanking {
  setorId: number
  setor: string
  categoriaId: number
  categoria: string
  media: number
  percentual45: number
  total: number
}

export interface Ranking {
  melhores: ItemRanking[]
  piores: ItemRanking[]
}

export interface ComentarioRecente {
  id: number
  respostaId: number
  tipo: TipoComentario
  texto: string
  setor: string
  dataAtendimento: string
  enviadoEm: string
  classificacao: Classificacao
}

export interface FiltrosRespostas extends Partial<FiltrosDashboard> {
  classificacao?: Classificacao
  comComentario?: boolean
  comRetorno?: boolean
  pagina?: number
  porPagina?: number
  ordenarPor?: 'dataAtendimento' | 'enviadoEm' | 'nps'
  ordem?: 'asc' | 'desc'
}

export interface RespostaResumo {
  id: number
  setorId: number
  setor: string
  canal: Canal
  dataAtendimento: string
  turno: string
  nps: number
  classificacao: Classificacao
  enviadoEm: string
  temComentario: boolean
  pediuRetorno: boolean
}

export interface ItemResposta {
  perguntaId: number
  perguntaTexto: string
  categoria: string
  tipo: TipoPergunta
  valorNumero: number | null
  valorTexto: string | null
  /** Só para notas de 1 a 5; a API já devolve pronta. */
  classificacao: Classificacao | null
}

export interface RespostaDetalhe extends RespostaResumo {
  itens: ItemResposta[]
  comentario: { tipo: TipoComentario; texto: string } | null
  contato: { id: number; telefoneMascarado: string; status: 'NOVO' } | null
}

export interface PedidoRetorno {
  id: number
  respostaId: number
  setor: string
  dataAtendimento: string
  nps: number
  classificacao: Classificacao
  comentario: { tipo: TipoComentario; texto: string } | null
  telefoneMascarado: string
  consentimentoEm: string
  status: 'NOVO'
}

// ---------- TV Wall ----------

export interface IndicadoresTv {
  tela: string
  geradoEm: string
  /** Mês corrente, pela data do atendimento. */
  mes: Pick<Resumo, 'nps' | 'total' | 'promotores' | 'neutros' | 'detratores' | 'mediaEscala'>
  npsPorSetor: Omit<NpsSetor, 'setorId'>[]
  evolucao: PontoEvolucao[]
  destaques: Pick<ItemRanking, 'setor' | 'categoria' | 'media' | 'percentual45'>[]
}
