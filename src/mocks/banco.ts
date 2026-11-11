// "Banco" do mock. Faz o papel do servidor: os cadastros e as respostas novas ficam
// no localStorage para a pesquisa enviada aparecer no dashboard e na TV.
// Limitação conhecida: só vale dentro do mesmo navegador.
import type {
  Canal,
  Categoria,
  Classificacao,
  Perfil,
  Pergunta,
  Setor,
  TelaTv,
  TipoComentario,
  TipoPergunta,
  Turno,
} from '@/lib/api/tipos'
import { CATEGORIAS, CONFIGURACOES, PERGUNTAS, SETORES, TURNOS, TV_TELAS, USUARIOS } from './seed/dados'
import { gerarHistorico } from './seed/historico'

export interface RespostaBanco {
  id: number
  setorId: number
  canal: Canal
  dataAtendimento: string
  turnoId: number
  nps: number
  classificacao: Classificacao
  enviadoEm: string
  itens: {
    perguntaId: number
    categoriaId: number
    /** cópia do texto no momento da resposta */
    perguntaTexto: string
    tipo: TipoPergunta
    valorNumero: number | null
    valorTexto: string | null
  }[]
  comentario: { tipo: TipoComentario; texto: string } | null
  contato: { id: number; telefone: string; consentimentoEm: string } | null
  chaveIdempotencia?: string
  complemento?: { token: string; expiraEm: string; usado: boolean }
}

export interface UsuarioBanco {
  id: number
  nome: string
  email: string
  senha: string
  perfil: Perfil
  ativo: boolean
  trocarSenha: boolean
  setorIds: number[]
  ultimoLoginEm: string | null
}

export interface Banco {
  versao: number
  setores: Setor[]
  categorias: Categoria[]
  turnos: Turno[]
  perguntas: Omit<Pergunta, 'temRespostas'>[]
  usuarios: UsuarioBanco[]
  tvTelas: (TelaTv & { token: string })[]
  configuracoes: typeof CONFIGURACOES
  respostasNovas: RespostaBanco[]
  refreshTokens: { token: string; usuarioId: number; expiraEm: number }[]
  auditoria: { em: string; usuarioId: number; acao: string; entidadeId: number }[]
}

const CHAVE = 'fhdod-mock-banco'
const VERSAO = 1
const temStorage = typeof localStorage !== 'undefined'
const copiar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T

function inicial(): Banco {
  // cópia profunda via JSON: structuredClone falta em navegadores de totem antigos
  return copiar({
    versao: VERSAO,
    setores: SETORES,
    categorias: CATEGORIAS,
    turnos: TURNOS,
    perguntas: PERGUNTAS,
    usuarios: USUARIOS.map(({ demo: _demo, ...usuario }) => ({ ...usuario, ativo: true, ultimoLoginEm: null })),
    tvTelas: TV_TELAS,
    configuracoes: CONFIGURACOES,
    respostasNovas: [],
    refreshTokens: [],
    auditoria: [],
  })
}

function carregar(): Banco {
  if (temStorage) {
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) ?? 'null') as Banco | null
      if (salvo?.versao === VERSAO) return salvo
    } catch {
      // dado corrompido: recomeça dos dados iniciais
    }
  }
  return inicial()
}

export let banco = carregar()

// O histórico é recalculado a cada carga (semente fixa por dia), então não ocupa o localStorage.
// Só é gerado quando o painel ou a TV pedem: a pesquisa do paciente não paga esse custo.
let historico: RespostaBanco[] | null = null
export const todasAsRespostas = (): RespostaBanco[] => [...(historico ??= gerarHistorico()), ...banco.respostasNovas]

export function salvar() {
  if (!temStorage) return
  try {
    localStorage.setItem(CHAVE, JSON.stringify(banco))
  } catch {
    // sem espaço no navegador: os dados seguem só na memória desta aba
  }
}

export function restaurarDadosIniciais() {
  banco = inicial()
  salvar()
}

export const proximoId = (lista: { id: number }[], minimo = 0) =>
  Math.max(minimo, ...lista.map((item) => item.id)) + 1

// Outra aba gravou (ex.: a pesquisa aberta ao lado do painel): relê para os números baterem.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE) banco = carregar()
  })
}
