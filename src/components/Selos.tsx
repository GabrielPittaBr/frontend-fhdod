// Selos do painel. Cada um tem ícone + texto: a informação nunca depende só da cor.
import { CircleAlert, Lightbulb, MessageCircle, MessageSquareWarning, ThumbsUp, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { Classificacao, TipoComentario } from '@/lib/api/tipos'
import { ROTULO_CLASSIFICACAO, ROTULO_COMENTARIO } from '@/lib/rotulos'
import { cn } from '@/lib/utils'

const base = 'inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-xs font-medium whitespace-nowrap'

const CLASSIFICACAO: Record<Classificacao, { classe: string; icone?: LucideIcon }> = {
  NORMAL: { classe: 'border-border bg-muted text-muted-foreground' },
  BAIXA: { classe: 'border-aviso-borda bg-aviso-fundo text-aviso', icone: TriangleAlert },
  BAIXISSIMA: { classe: 'border-[#d9483b] bg-[#f8dedc] text-foreground', icone: CircleAlert },
}

/** A classificação vem pronta da API; aqui só se exibe. */
export function SeloClassificacao({ valor }: { valor: Classificacao }) {
  const { classe, icone: Icone } = CLASSIFICACAO[valor]
  return (
    <span className={cn(base, classe)}>
      {Icone && <Icone aria-hidden className="size-3.5" />}
      {ROTULO_CLASSIFICACAO[valor]}
    </span>
  )
}

const COMENTARIO: Record<TipoComentario, LucideIcon> = {
  ELOGIO: ThumbsUp,
  RECLAMACAO: MessageSquareWarning,
  SUGESTAO: Lightbulb,
  OUTRO: MessageCircle,
}

/** Elogio, reclamação, sugestão e outro com o mesmo peso visual. */
export function SeloComentario({ tipo }: { tipo: TipoComentario }) {
  const Icone = COMENTARIO[tipo]
  return (
    <span className={cn(base, 'border-input/50 bg-card text-foreground')}>
      <Icone aria-hidden className="size-3.5" />
      {ROTULO_COMENTARIO[tipo]}
    </span>
  )
}
