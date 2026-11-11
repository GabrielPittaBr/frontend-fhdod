// Dados iniciais do mock. Tudo aqui é inventado: nenhum nome, telefone ou
// comentário é real. As credenciais são falsas e só existem para a demonstração.
import type { Categoria, Perfil, Pergunta, Setor, TipoComentario, Turno } from '@/lib/api/tipos'

export const SETORES: Setor[] = [
  { id: 1, nome: 'Pronto Atendimento', slug: 'pronto-atendimento', descricao: 'Urgência e emergência, 24 horas', ativo: true },
  { id: 2, nome: 'Internação', slug: 'internacao', descricao: 'Quartos e enfermarias', ativo: true },
  { id: 3, nome: 'Raio-X', slug: 'raio-x', descricao: 'Exames de imagem', ativo: true },
  { id: 4, nome: 'Laboratório', slug: 'laboratorio', descricao: 'Coleta e exames', ativo: true },
  { id: 5, nome: 'Ambulatório', slug: 'ambulatorio', descricao: 'Consultas agendadas', ativo: true },
  { id: 6, nome: 'Maternidade', slug: 'maternidade', descricao: 'Em reforma: pesquisa pausada', ativo: false },
]

export const CAT = {
  RECEPCAO: 1,
  TRIAGEM: 2,
  ENFERMAGEM: 3,
  MEDICO: 4,
  HIGIENE: 5,
  ESTRUTURA: 6,
  ESPERA: 7,
} as const

export const CATEGORIAS: Categoria[] = [
  { id: CAT.RECEPCAO, nome: 'Recepção', ordem: 1, ativa: true },
  { id: CAT.TRIAGEM, nome: 'Triagem', ordem: 2, ativa: true },
  { id: CAT.ENFERMAGEM, nome: 'Enfermagem', ordem: 3, ativa: true },
  { id: CAT.MEDICO, nome: 'Médico', ordem: 4, ativa: true },
  { id: CAT.HIGIENE, nome: 'Higiene e Limpeza', ordem: 5, ativa: true },
  { id: CAT.ESTRUTURA, nome: 'Estrutura', ordem: 6, ativa: true },
  { id: CAT.ESPERA, nome: 'Tempo de Espera', ordem: 7, ativa: true },
]

// Horários provisórios: os oficiais dependem do hospital (ponto em aberto do plano).
export const TURNOS: Turno[] = [
  { id: 1, nome: 'Manhã', horaInicio: '07:00', horaFim: '13:00', ordem: 1 },
  { id: 2, nome: 'Tarde', horaInicio: '13:00', horaFim: '19:00', ordem: 2 },
  { id: 3, nome: 'Noite', horaInicio: '19:00', horaFim: '07:00', ordem: 3 },
]

type PerguntaSeed = Omit<Pergunta, 'temRespostas' | 'ordem' | 'id'>
const p = (
  setorId: number,
  categoriaId: number,
  texto: string,
  tipo: Pergunta['tipo'] = 'ESCALA_1_5',
  opcoes: string[] | null = null,
  ativa = true,
): PerguntaSeed => ({ setorId, categoriaId, texto, tipo, opcoes, ativa })

// Na ordem da jornada do paciente. A Internação passa de 8 ativas de propósito,
// para o painel mostrar o aviso de pesquisa longa.
const PERGUNTAS_SEED: PerguntaSeed[] = [
  p(1, CAT.RECEPCAO, 'Como foi o atendimento na recepção?'),
  p(1, CAT.TRIAGEM, 'Como foi a primeira avaliação, quando perguntaram o que você sentia?'),
  p(1, CAT.ESPERA, 'O que você achou do tempo de espera?'),
  p(1, CAT.ENFERMAGEM, 'Como a equipe de enfermagem cuidou de você?'),
  p(1, CAT.MEDICO, 'Como foi a consulta com o médico?'),
  p(1, CAT.MEDICO, 'O médico explicou o seu caso de um jeito fácil de entender?', 'SIM_NAO'),

  p(2, CAT.RECEPCAO, 'Como foi a sua chegada e o registro da internação?'),
  p(2, CAT.ENFERMAGEM, 'Como a equipe de enfermagem cuidou de você?'),
  p(2, CAT.ENFERMAGEM, 'Quando você chamou, alguém veio atender logo?', 'SIM_NAO'),
  p(2, CAT.MEDICO, 'Como foram as visitas do médico?'),
  p(2, CAT.MEDICO, 'Explicaram o seu tratamento de um jeito fácil de entender?', 'SIM_NAO'),
  p(2, CAT.HIGIENE, 'Como estava a limpeza do quarto e do banheiro?'),
  p(2, CAT.ESTRUTURA, 'Como era o conforto do quarto?'),
  p(2, CAT.ESTRUTURA, 'Como estava o barulho à noite?', 'MULTIPLA_ESCOLHA', [
    'Silencioso',
    'Um pouco de barulho',
    'Muito barulho',
  ]),
  p(2, CAT.ENFERMAGEM, 'Algum profissional merece um elogio? Conte para nós.', 'TEXTO'),
  p(2, CAT.ESTRUTURA, 'O que você achou da comida?', 'ESCALA_1_5', null, false),

  p(3, CAT.RECEPCAO, 'Como foi o atendimento na recepção?'),
  p(3, CAT.ESPERA, 'Quanto tempo você esperou para fazer o exame?', 'MULTIPLA_ESCOLHA', [
    'Menos de 15 minutos',
    'De 15 a 30 minutos',
    'De 30 minutos a 1 hora',
    'Mais de 1 hora',
  ]),
  p(3, CAT.ENFERMAGEM, 'Como o profissional que fez o exame tratou você?'),
  p(3, CAT.ENFERMAGEM, 'Explicaram como seria o exame antes de começar?', 'SIM_NAO'),
  p(3, CAT.ESTRUTURA, 'Como estava a sala de espera?'),

  p(4, CAT.RECEPCAO, 'Como foi o atendimento na recepção?'),
  p(4, CAT.ESPERA, 'O que você achou do tempo de espera?'),
  p(4, CAT.ENFERMAGEM, 'Como foi a coleta do exame?'),
  p(4, CAT.HIGIENE, 'Como estava a limpeza do local?'),

  p(5, CAT.RECEPCAO, 'Como foi o atendimento na recepção?'),
  p(5, CAT.RECEPCAO, 'Foi fácil marcar a consulta?', 'SIM_NAO'),
  p(5, CAT.ESPERA, 'O que você achou do tempo de espera?'),
  p(5, CAT.MEDICO, 'Como foi a consulta com o médico?'),
  p(5, CAT.MEDICO, 'Você saiu sabendo o que fazer depois da consulta?', 'SIM_NAO'),
  p(5, CAT.ESTRUTURA, 'Como estava a sala de espera?'),

  p(6, CAT.RECEPCAO, 'Como foi o atendimento na recepção?'),
  p(6, CAT.ENFERMAGEM, 'Como a equipe de enfermagem cuidou de você e do bebê?'),
  p(6, CAT.MEDICO, 'Como foi o atendimento do médico?'),
  p(6, CAT.ESTRUTURA, 'Como era o conforto do quarto?'),
]

export const PERGUNTAS: Omit<Pergunta, 'temRespostas'>[] = PERGUNTAS_SEED.map((pergunta, i, todas) => ({
  ...pergunta,
  id: i + 1,
  ordem: todas.slice(0, i).filter((q) => q.setorId === pergunta.setorId).length + 1,
}))

export interface UsuarioSeed {
  id: number
  nome: string
  email: string
  senha: string
  perfil: Perfil
  setorIds: number[]
  trocarSenha: boolean
  demo: string
}

export const USUARIOS: UsuarioSeed[] = [
  { id: 1, nome: 'Paulo Klein', email: 'admin@fhdod.example', senha: 'admin-demo-2026', perfil: 'SUPER_ADMIN', setorIds: [], trocarSenha: false, demo: 'Vê e gerencia tudo' },
  { id: 2, nome: 'Marta Schneider', email: 'marta@fhdod.example', senha: 'gestor-demo-2026', perfil: 'GESTOR', setorIds: [1, 2], trocarSenha: false, demo: 'Pronto Atendimento e Internação' },
  { id: 3, nome: 'Renata Oliveira', email: 'renata@fhdod.example', senha: 'ouvidoria-demo-2026', perfil: 'OUVIDORIA', setorIds: [], trocarSenha: false, demo: 'Todos os setores e os pedidos de retorno' },
  { id: 4, nome: 'Diego Fontana', email: 'diego@fhdod.example', senha: 'leitura-demo-2026', perfil: 'VISUALIZADOR', setorIds: [3], trocarSenha: false, demo: 'Só os indicadores do Raio-X' },
  { id: 5, nome: 'Luana Becker', email: 'luana@fhdod.example', senha: 'provisoria-2026', perfil: 'GESTOR', setorIds: [4], trocarSenha: true, demo: 'Primeiro acesso: precisa trocar a senha' },
]

export const TV_TELAS = [
  { id: 1, nome: 'Recepção principal', ativa: true, ultimoAcessoEm: null, token: 'demo-recepcao-fhdod' },
  { id: 2, nome: 'Corredor da Internação', ativa: false, ultimoAcessoEm: null, token: 'demo-corredor-desativada' },
]

// Padrões da tabela "Configurações do sistema" do Plano de Desenvolvimento.
export const CONFIGURACOES = {
  nps_limite_baixa: 6,
  nps_limite_baixissima: 2,
  escala_limite_baixa: 3,
  escala_limite_baixissima: 1,
  totem_reinicio_segundos: 15,
  totem_inatividade_segundos: 60,
  texto_limite_caracteres: 500,
  nps_texto: 'De 0 a 10, qual a probabilidade de você recomendar o hospital a alguém?',
}

export const COMENTARIOS: Record<TipoComentario, string[]> = {
  ELOGIO: [
    'A enfermeira da noite foi muito atenciosa com a minha mãe.',
    'Fui atendido rápido e o médico explicou tudo com calma.',
    'Equipe da recepção educada e prestativa. Parabéns.',
    'O técnico do raio-x teve muita paciência comigo.',
    'Lugar limpo e organizado. Me senti bem cuidada.',
    'A moça da coleta tem a mão leve, nem senti a agulha.',
    'Atendimento muito bom do início ao fim.',
    'Quero agradecer à equipe de enfermagem pelo carinho.',
    'O doutor ouviu tudo o que eu tinha para falar.',
    'Mesmo com o hospital cheio, todos foram gentis.',
    'Meu pai foi muito bem tratado. Obrigada a todos.',
    'A recepcionista me ajudou com os papéis sem pressa.',
  ],
  RECLAMACAO: [
    'Esperei mais de duas horas para ser atendido.',
    'Ninguém avisava quanto tempo ainda ia demorar.',
    'O banheiro da sala de espera estava sujo.',
    'Faltou cadeira para sentar enquanto esperava.',
    'A recepção demorou para me chamar e ninguém explicou o motivo.',
    'O ar-condicionado do quarto não funcionava.',
    'Fiquei muito tempo com dor antes de alguém me olhar.',
    'Me senti mal atendido na recepção.',
    'Muito barulho no corredor durante a noite.',
    'O médico atendeu com pressa e não explicou direito.',
  ],
  SUGESTAO: [
    'Poderia ter um painel mostrando a ordem de chamada.',
    'Seria bom ter água na sala de espera.',
    'Mais cadeiras na recepção ajudariam.',
    'Avisar o tempo de espera logo na chegada.',
    'Podiam colocar uma televisão na espera.',
    'Sinalizar melhor o caminho até o raio-x.',
    'Deixar agendar a coleta pelo telefone.',
  ],
  OUTRO: [
    'Esqueci um guarda-chuva na sala de espera.',
    'Gostaria de saber como retirar o resultado do exame.',
    'Onde vejo os horários de visita?',
  ],
}

export const ELOGIOS_A_PROFISSIONAIS = [
  'A técnica do turno da noite, sempre sorrindo.',
  'O rapaz da limpeza, muito educado.',
  'Todos do turno da manhã.',
  'A enfermeira de cabelo curto que me acalmou.',
  'O médico que me atendeu no segundo dia.',
]
