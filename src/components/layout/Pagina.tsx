import type { UseQueryResult } from '@tanstack/react-query'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { mensagemDeErro } from '@/lib/api/erro'
import { cn } from '@/lib/utils'

/** Cabeçalho e corpo de uma página do painel. */
export function Pagina({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo: string
  descricao?: ReactNode
  acoes?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <title>{`${titulo} | Painel FHDOD`}</title>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-bold text-balance">{titulo}</h1>
          {descricao && <p className="mt-1 max-w-[70ch] text-muted-foreground">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
      <div className="mt-6 grid gap-5">{children}</div>
    </div>
  )
}

/** Bloco de conteúdo: superfície plana com borda, sem sombra. */
export function Bloco({
  titulo,
  descricao,
  lateral,
  className,
  children,
}: {
  titulo?: string
  descricao?: ReactNode
  lateral?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('min-w-0 rounded-lg border bg-card p-4 sm:p-5', className)}>
      {(titulo || lateral) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div>
            {titulo && <h2 className="text-base font-semibold">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-sm text-muted-foreground">{descricao}</p>}
          </div>
          {lateral}
        </div>
      )}
      {children}
    </section>
  )
}

/**
 * Estados de uma leitura, iguais em todos os blocos: carregando, erro (com nova tentativa),
 * vazio e pronto. Se uma atualização falhar, os últimos dados continuam na tela.
 */
export function Consulta<T>({
  consulta,
  vazio,
  textoVazio = 'Nada para mostrar com estes filtros.',
  altura = 'h-40',
  children,
}: {
  consulta: UseQueryResult<T>
  vazio?: (dados: T) => boolean
  textoVazio?: string
  altura?: string
  children: (dados: T) => ReactNode
}) {
  if (consulta.data !== undefined) {
    if (vazio?.(consulta.data)) return <p className="py-8 text-center text-muted-foreground">{textoVazio}</p>
    return <div className={cn('transition-opacity', consulta.isPlaceholderData && 'opacity-60')}>{children(consulta.data)}</div>
  }
  if (consulta.isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
        <TriangleAlert aria-hidden className="size-6 text-aviso" />
        <p className="text-sm">{mensagemDeErro(consulta.error, 'Não deu para carregar estes dados.')}</p>
        <Button variant="outline" size="sm" onClick={() => consulta.refetch()}>
          Tentar de novo
        </Button>
      </div>
    )
  }
  return <Skeleton className={cn('w-full', altura)} />
}
