// Nomes que a pessoa lê na tela para os códigos do contrato.
import type { Canal, Classificacao, Perfil, TipoComentario, TipoPergunta } from '@/lib/api/tipos'

export const ROTULO_PERFIL: Record<Perfil, string> = {
  SUPER_ADMIN: 'Super Admin',
  GESTOR: 'Gestor de setor',
  OUVIDORIA: 'Ouvidoria',
  VISUALIZADOR: 'Visualizador',
}

export const ROTULO_CANAL: Record<Canal, string> = {
  WEB: 'Celular ou computador',
  TOTEM: 'Totem',
}

export const ROTULO_CLASSIFICACAO: Record<Classificacao, string> = {
  NORMAL: 'Normal',
  BAIXA: 'Baixa',
  BAIXISSIMA: 'Baixíssima',
}

export const ROTULO_COMENTARIO: Record<TipoComentario, string> = {
  ELOGIO: 'Elogio',
  RECLAMACAO: 'Reclamação',
  SUGESTAO: 'Sugestão',
  OUTRO: 'Outro',
}

export const ROTULO_TIPO_PERGUNTA: Record<TipoPergunta, string> = {
  ESCALA_1_5: 'Rostinhos (1 a 5)',
  SIM_NAO: 'Sim ou não',
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  TEXTO: 'Texto livre',
}
