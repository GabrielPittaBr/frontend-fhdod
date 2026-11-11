// Cadastros do painel: setores, categorias, turnos, perguntas, usuários e telas de TV.
import type { Categoria, DetalheErro, Envelope, Perfil, Pergunta, Setor, TelaTv, TipoPergunta, Turno, Usuario } from '@/lib/api/tipos'
import { autenticar, emitirRefresh, exigir, exigirSetor, revogarSessoes } from './auth'
import { banco, proximoId, restaurarDadosIniciais, salvar, todasAsRespostas, type UsuarioBanco } from './banco'
import { erros, rede, tokenAleatorio } from './rede'

const PERFIS: Perfil[] = ['SUPER_ADMIN', 'GESTOR', 'OUVIDORIA', 'VISUALIZADOR']
const TIPOS: TipoPergunta[] = ['ESCALA_1_5', 'SIM_NAO', 'MULTIPLA_ESCOLHA', 'TEXTO']

function validar(regras: [campo: string, valido: boolean, mensagem: string][]) {
  const detalhes: DetalheErro[] = regras.filter(([, valido]) => !valido).map(([campo, , mensagem]) => ({ campo, mensagem }))
  if (detalhes.length) throw erros.validacao(detalhes)
}

function achar<T extends { id: number }>(lista: T[], id: number, oQue: string): T {
  const item = lista.find((i) => i.id === id)
  if (!item) throw erros.naoEncontrado(`${oQue} não encontrado.`)
  return item
}

const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// ---------- Setores ----------

export interface DadosSetor {
  nome: string
  slug: string
  descricao: string | null
}

function validarSetor(corpo: DadosSetor, ignorarId?: number) {
  validar([
    ['nome', corpo.nome.trim().length >= 2, 'Informe o nome do setor'],
    ['slug', /^[a-z0-9]+(-[a-z0-9]+)*$/.test(corpo.slug), 'Use só letras minúsculas, números e hífen'],
  ])
  if (banco.setores.some((s) => s.slug === corpo.slug && s.id !== ignorarId)) {
    throw erros.conflito('Já existe um setor com este endereço. Escolha outro.')
  }
}

/** GET /setores */
export async function listarSetores(token: string): Promise<Envelope<Setor[]>> {
  await rede()
  const { setorIds } = autenticar(token)
  return {
    data: banco.setores
      .filter((s) => !setorIds || setorIds.includes(s.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
  }
}

/** POST /setores */
export async function criarSetor(token: string, corpo: DadosSetor): Promise<Envelope<Setor>> {
  await rede()
  exigir(autenticar(token), 'setores:gerenciar')
  validarSetor(corpo)
  const setor: Setor = { id: proximoId(banco.setores), nome: corpo.nome.trim(), slug: corpo.slug, descricao: corpo.descricao?.trim() || null, ativo: true }
  banco.setores.push(setor)
  salvar()
  return { data: setor }
}

/** PATCH /setores/:id */
export async function editarSetor(token: string, id: number, corpo: DadosSetor): Promise<Envelope<Setor>> {
  await rede()
  exigir(autenticar(token), 'setores:gerenciar')
  const setor = achar(banco.setores, id, 'Setor')
  validarSetor(corpo, id)
  Object.assign(setor, { nome: corpo.nome.trim(), slug: corpo.slug, descricao: corpo.descricao?.trim() || null })
  salvar()
  return { data: setor }
}

/** PATCH /setores/:id/status */
export async function alterarStatusSetor(token: string, id: number, ativo: boolean): Promise<void> {
  await rede()
  exigir(autenticar(token), 'setores:gerenciar')
  achar(banco.setores, id, 'Setor').ativo = ativo
  salvar()
}

// ---------- Categorias ----------

/** GET /categorias */
export async function listarCategorias(token: string): Promise<Envelope<Categoria[]>> {
  await rede()
  autenticar(token)
  return { data: [...banco.categorias].sort((a, b) => a.ordem - b.ordem) }
}

function validarCategoria(nome: string, ignorarId?: number) {
  validar([['nome', nome.trim().length >= 2, 'Informe o nome da categoria']])
  if (banco.categorias.some((c) => igual(c.nome, nome) && c.id !== ignorarId)) {
    throw erros.conflito('Já existe uma categoria com este nome.')
  }
}

/** POST /categorias */
export async function criarCategoria(token: string, corpo: { nome: string }): Promise<Envelope<Categoria>> {
  await rede()
  exigir(autenticar(token), 'categorias:gerenciar')
  validarCategoria(corpo.nome)
  const categoria: Categoria = {
    id: proximoId(banco.categorias),
    nome: corpo.nome.trim(),
    ordem: Math.max(0, ...banco.categorias.map((c) => c.ordem)) + 1,
    ativa: true,
  }
  banco.categorias.push(categoria)
  salvar()
  return { data: categoria }
}

/** PATCH /categorias/:id (edita ou desativa) */
export async function editarCategoria(token: string, id: number, corpo: { nome?: string; ativa?: boolean }): Promise<Envelope<Categoria>> {
  await rede()
  exigir(autenticar(token), 'categorias:gerenciar')
  const categoria = achar(banco.categorias, id, 'Categoria')
  if (corpo.nome !== undefined) {
    validarCategoria(corpo.nome, id)
    categoria.nome = corpo.nome.trim()
  }
  if (corpo.ativa !== undefined) categoria.ativa = corpo.ativa
  salvar()
  return { data: categoria }
}

// ---------- Turnos ----------

export type DadosTurno = Pick<Turno, 'nome' | 'horaInicio' | 'horaFim'>

function validarTurno(corpo: DadosTurno) {
  const hora = /^([01]\d|2[0-3]):[0-5]\d$/
  validar([
    ['nome', corpo.nome.trim().length >= 2, 'Informe o nome do turno'],
    ['horaInicio', hora.test(corpo.horaInicio), 'Informe a hora de início'],
    ['horaFim', hora.test(corpo.horaFim), 'Informe a hora de fim'],
    ['horaFim', corpo.horaInicio !== corpo.horaFim, 'O fim precisa ser diferente do início'],
  ])
}

/** GET /turnos */
export async function listarTurnos(token: string): Promise<Envelope<Turno[]>> {
  await rede()
  autenticar(token)
  return { data: [...banco.turnos].sort((a, b) => a.ordem - b.ordem) }
}

/** POST /turnos */
export async function criarTurno(token: string, corpo: DadosTurno): Promise<Envelope<Turno>> {
  await rede()
  exigir(autenticar(token), 'turnos:gerenciar')
  validarTurno(corpo)
  const turno: Turno = {
    id: proximoId(banco.turnos),
    nome: corpo.nome.trim(),
    horaInicio: corpo.horaInicio,
    horaFim: corpo.horaFim,
    ordem: Math.max(0, ...banco.turnos.map((t) => t.ordem)) + 1,
  }
  banco.turnos.push(turno)
  salvar()
  return { data: turno }
}

/** PATCH /turnos/:id (nome e horários) */
export async function editarTurno(token: string, id: number, corpo: DadosTurno): Promise<Envelope<Turno>> {
  await rede()
  exigir(autenticar(token), 'turnos:gerenciar')
  const turno = achar(banco.turnos, id, 'Turno')
  validarTurno(corpo)
  Object.assign(turno, { nome: corpo.nome.trim(), horaInicio: corpo.horaInicio, horaFim: corpo.horaFim })
  salvar()
  return { data: turno }
}

// ---------- Perguntas ----------

export interface DadosPergunta {
  texto: string
  categoriaId: number
  tipo: TipoPergunta
  opcoes: string[] | null
}

function perguntasComResposta() {
  return new Set(todasAsRespostas().flatMap((r) => r.itens.map((i) => i.perguntaId)))
}

function normalizarPergunta(corpo: DadosPergunta): DadosPergunta {
  const opcoes = corpo.tipo === 'MULTIPLA_ESCOLHA' ? (corpo.opcoes ?? []).map((o) => o.trim()).filter(Boolean) : null
  validar([
    ['texto', corpo.texto.trim().length >= 5, 'Escreva a pergunta'],
    ['texto', corpo.texto.trim().length <= 140, 'Use no máximo 140 caracteres: perguntas curtas são mais respondidas'],
    ['categoriaId', banco.categorias.some((c) => c.id === corpo.categoriaId), 'Escolha uma categoria'],
    ['tipo', TIPOS.includes(corpo.tipo), 'Escolha o tipo da pergunta'],
    ['opcoes', opcoes === null || (opcoes.length >= 2 && opcoes.length <= 5), 'Informe de 2 a 5 opções'],
    ['opcoes', opcoes === null || new Set(opcoes.map((o) => o.toLowerCase())).size === opcoes.length, 'As opções não podem se repetir'],
  ])
  return { texto: corpo.texto.trim(), categoriaId: corpo.categoriaId, tipo: corpo.tipo, opcoes }
}

/** GET /setores/:setorId/perguntas */
export async function listarPerguntas(token: string, setorId: number): Promise<Envelope<Pergunta[]>> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'perguntas:gerenciar')
  achar(banco.setores, setorId, 'Setor')
  exigirSetor(contexto, setorId)
  const respondidas = perguntasComResposta()
  return {
    data: banco.perguntas
      .filter((p) => p.setorId === setorId)
      .sort((a, b) => a.ordem - b.ordem)
      .map((p) => ({ ...p, temRespostas: respondidas.has(p.id) })),
  }
}

/** POST /setores/:setorId/perguntas */
export async function criarPergunta(token: string, setorId: number, corpo: DadosPergunta): Promise<Envelope<Pergunta>> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'perguntas:gerenciar')
  achar(banco.setores, setorId, 'Setor')
  exigirSetor(contexto, setorId)
  const pergunta = {
    ...normalizarPergunta(corpo),
    id: proximoId(banco.perguntas),
    setorId,
    ordem: Math.max(0, ...banco.perguntas.filter((p) => p.setorId === setorId).map((p) => p.ordem)) + 1,
    ativa: true,
  }
  banco.perguntas.push(pergunta)
  salvar()
  return { data: { ...pergunta, temRespostas: false } }
}

/** PATCH /perguntas/:id */
export async function editarPergunta(token: string, id: number, corpo: DadosPergunta): Promise<Envelope<Pergunta>> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'perguntas:gerenciar')
  const pergunta = achar(banco.perguntas, id, 'Pergunta')
  exigirSetor(contexto, pergunta.setorId)
  const temRespostas = perguntasComResposta().has(id)
  // Quem já respondeu viu a pergunta com este tipo: trocar mudaria o sentido do histórico.
  if (temRespostas && corpo.tipo !== pergunta.tipo) {
    throw erros.conflito('Esta pergunta já tem respostas, então o tipo não pode mudar. Crie outra pergunta e desative esta.')
  }
  Object.assign(pergunta, normalizarPergunta(corpo))
  salvar()
  return { data: { ...pergunta, temRespostas } }
}

/** PUT /setores/:setorId/perguntas/ordem */
export async function salvarOrdemDasPerguntas(token: string, setorId: number, ids: number[]): Promise<void> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'perguntas:gerenciar')
  exigirSetor(contexto, setorId)
  const doSetor = banco.perguntas.filter((p) => p.setorId === setorId)
  validar([['ids', ids.length === doSetor.length && doSetor.every((p) => ids.includes(p.id)), 'A lista precisa ter todas as perguntas do setor']])
  for (const pergunta of doSetor) pergunta.ordem = ids.indexOf(pergunta.id) + 1
  salvar()
}

/** PATCH /perguntas/:id/status */
export async function alterarStatusPergunta(token: string, id: number, ativa: boolean): Promise<void> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'perguntas:gerenciar')
  const pergunta = achar(banco.perguntas, id, 'Pergunta')
  exigirSetor(contexto, pergunta.setorId)
  pergunta.ativa = ativa
  salvar()
}

// ---------- Usuários ----------

export interface DadosUsuario {
  nome: string
  email: string
  perfil: Perfil
}

const paraApi = ({ senha: _senha, ...usuario }: UsuarioBanco): Usuario => usuario
// sempre com letras e números, como a regra de senha exige
const senhaProvisoria = () => `Fh${tokenAleatorio().slice(0, 8)}9k`

function validarUsuario(corpo: DadosUsuario, ignorarId?: number) {
  validar([
    ['nome', corpo.nome.trim().length >= 3, 'Informe o nome completo'],
    ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(corpo.email), 'Informe um e-mail válido'],
    ['perfil', PERFIS.includes(corpo.perfil), 'Escolha um perfil'],
  ])
  if (banco.usuarios.some((u) => igual(u.email, corpo.email) && u.id !== ignorarId)) {
    throw erros.conflito('Já existe um usuário com este e-mail.')
  }
}

/** GET /usuarios */
export async function listarUsuarios(token: string): Promise<Envelope<Usuario[]>> {
  await rede()
  exigir(autenticar(token), 'usuarios:gerenciar')
  return { data: banco.usuarios.map(paraApi).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) }
}

/** POST /usuarios: cria com senha provisória, devolvida uma única vez. */
export async function criarUsuario(token: string, corpo: DadosUsuario): Promise<Envelope<{ usuario: Usuario; senhaProvisoria: string }>> {
  await rede()
  exigir(autenticar(token), 'usuarios:gerenciar')
  validarUsuario(corpo)
  const usuario: UsuarioBanco = {
    id: proximoId(banco.usuarios),
    nome: corpo.nome.trim(),
    email: corpo.email.trim().toLowerCase(),
    perfil: corpo.perfil,
    senha: senhaProvisoria(),
    ativo: true,
    trocarSenha: true,
    setorIds: [],
    ultimoLoginEm: null,
  }
  banco.usuarios.push(usuario)
  salvar()
  return { data: { usuario: paraApi(usuario), senhaProvisoria: usuario.senha } }
}

/** PATCH /usuarios/:id (nome e perfil) */
export async function editarUsuario(token: string, id: number, corpo: Pick<DadosUsuario, 'nome' | 'perfil'>): Promise<Envelope<Usuario>> {
  await rede()
  exigir(autenticar(token), 'usuarios:gerenciar')
  const usuario = achar(banco.usuarios, id, 'Usuário')
  validarUsuario({ ...corpo, email: usuario.email }, id)
  Object.assign(usuario, { nome: corpo.nome.trim(), perfil: corpo.perfil })
  salvar()
  return { data: paraApi(usuario) }
}

/** PUT /usuarios/:id/setores */
export async function definirSetoresDoUsuario(token: string, id: number, setorIds: number[]): Promise<void> {
  await rede()
  exigir(autenticar(token), 'usuarios:gerenciar')
  const usuario = achar(banco.usuarios, id, 'Usuário')
  validar([['setorIds', setorIds.every((s) => banco.setores.some((setor) => setor.id === s)), 'Setor inválido']])
  usuario.setorIds = [...new Set(setorIds)]
  salvar()
}

/** PATCH /usuarios/:id/status: desativar também encerra as sessões da pessoa. */
export async function alterarStatusUsuario(token: string, id: number, ativo: boolean): Promise<void> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'usuarios:gerenciar')
  const usuario = achar(banco.usuarios, id, 'Usuário')
  if (!ativo && usuario.id === contexto.usuario.id) throw erros.conflito('Você não pode desativar a própria conta.')
  usuario.ativo = ativo
  if (!ativo) revogarSessoes(id)
  salvar()
}

/** POST /usuarios/:id/redefinir-senha */
export async function redefinirSenha(token: string, id: number): Promise<Envelope<{ senhaProvisoria: string }>> {
  await rede()
  exigir(autenticar(token), 'usuarios:gerenciar')
  const usuario = achar(banco.usuarios, id, 'Usuário')
  usuario.senha = senhaProvisoria()
  usuario.trocarSenha = true
  revogarSessoes(id)
  salvar()
  return { data: { senhaProvisoria: usuario.senha } }
}

// ---------- Telas de TV ----------

const telaParaApi = ({ token: _token, ...tela }: (typeof banco.tvTelas)[number]): TelaTv => tela

/** GET /tv-telas */
export async function listarTelasTv(token: string): Promise<Envelope<TelaTv[]>> {
  await rede()
  exigir(autenticar(token), 'tvwall:gerenciar')
  return { data: banco.tvTelas.map(telaParaApi) }
}

/** POST /tv-telas: o token da tela só é devolvido aqui, uma única vez. */
export async function criarTelaTv(token: string, corpo: { nome: string }): Promise<Envelope<{ tela: TelaTv; token: string }>> {
  await rede()
  exigir(autenticar(token), 'tvwall:gerenciar')
  validar([['nome', corpo.nome.trim().length >= 2, 'Informe onde a tela fica']])
  const tela = { id: proximoId(banco.tvTelas), nome: corpo.nome.trim(), ativa: true, ultimoAcessoEm: null, token: tokenAleatorio() }
  banco.tvTelas.push(tela)
  salvar()
  return { data: { tela: telaParaApi(tela), token: tela.token } }
}

/** PATCH /tv-telas/:id/status: desativar faz o link parar de funcionar. */
export async function alterarStatusTelaTv(token: string, id: number, ativa: boolean): Promise<void> {
  await rede()
  exigir(autenticar(token), 'tvwall:gerenciar')
  achar(banco.tvTelas, id, 'Tela').ativa = ativa
  salvar()
}

// ---------- Demonstração ----------

/** Só existe no mock: volta aos dados iniciais, mantendo quem está logado. */
export async function restaurarDados(token: string): Promise<void> {
  await rede()
  const contexto = autenticar(token)
  exigir(contexto, 'setores:gerenciar')
  restaurarDadosIniciais()
  emitirRefresh(contexto.usuario.id)
}
