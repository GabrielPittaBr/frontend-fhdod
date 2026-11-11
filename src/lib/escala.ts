// A escala de 1 a 5, igual na pesquisa, no painel e na TV: rosto + texto + cor de apoio.
// Ilustrações: Microsoft Fluent Emoji (MIT), arquivos locais em src/assets/emojis.
import muitoRuim from '@/assets/emojis/1-muito-ruim.svg'
import ruim from '@/assets/emojis/2-ruim.svg'
import regular from '@/assets/emojis/3-regular.svg'
import bom from '@/assets/emojis/4-bom.svg'
import muitoBom from '@/assets/emojis/5-muito-bom.svg'

// cor: a cor de apoio do nível. fundo e fundoForte: a mesma cor clareada, para o texto
// azul-marinho ficar com contraste acima de 8:1. borda: versão escura, com 3:1 sobre o fundo.
export const NIVEIS = [
  { valor: 1, rotulo: 'Muito ruim', imagem: muitoRuim, cor: 'var(--nota-1)', fundo: '#f8dedc', fundoForte: '#f2c1bc', borda: '#d9483b' },
  { valor: 2, rotulo: 'Ruim', imagem: ruim, cor: 'var(--nota-2)', fundo: '#fbe9dc', fundoForte: '#f8d6bc', borda: '#c4651a' },
  { valor: 3, rotulo: 'Regular', imagem: regular, cor: 'var(--nota-3)', fundo: '#faf1d9', fundoForte: '#f5e5b7', borda: '#a47e08' },
  { valor: 4, rotulo: 'Bom', imagem: bom, cor: 'var(--nota-4)', fundo: '#eaf3dc', fundoForte: '#d8e8bd', borda: '#5f8f1e' },
  { valor: 5, rotulo: 'Muito bom', imagem: muitoBom, cor: 'var(--nota-5)', fundo: '#daeee2', fundoForte: '#b8dfc8', borda: '#238a4b' },
] as const

export type Nivel = (typeof NIVEIS)[number]

/** O rosto mais próximo de uma média (ex.: 4,3 vira "Bom"). */
export const nivelDaMedia = (media: number): Nivel => NIVEIS[Math.min(4, Math.max(0, Math.round(media) - 1))]!
