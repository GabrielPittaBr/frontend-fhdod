// Campos de formulário do painel: rótulo sempre visível, erro embaixo do próprio campo.
import { useId, type ComponentProps, type ReactNode } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface BaseDoCampo {
  rotulo: string
  erro?: string
  dica?: ReactNode
}

function Moldura({ id, rotulo, erro, dica, children }: BaseDoCampo & { id: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
      {dica && !erro && (
        <p id={`${id}-dica`} className="text-sm text-muted-foreground">
          {dica}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="text-sm font-medium text-destructive">
          {erro}
        </p>
      )}
    </div>
  )
}

const descricao = (id: string, { erro, dica }: Partial<BaseDoCampo>) => (erro ? `${id}-erro` : dica ? `${id}-dica` : undefined)

export function CampoTexto({ rotulo, erro, dica, ...input }: BaseDoCampo & ComponentProps<'input'>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <Input id={id} autoComplete="off" aria-invalid={erro ? true : undefined} aria-describedby={descricao(id, { erro, dica })} {...input} />
    </Moldura>
  )
}

export const classeDaSelecao =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm'

/** Seleção nativa do navegador: acessível por teclado e toque sem código extra. */
export function CampoSelecao({ rotulo, erro, dica, className, children, ...select }: BaseDoCampo & ComponentProps<'select'>) {
  const id = useId()
  return (
    <Moldura id={id} rotulo={rotulo} erro={erro} dica={dica}>
      <select
        id={id}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao(id, { erro, dica })}
        className={cn(classeDaSelecao, className)}
        {...select}
      >
        {children}
      </select>
    </Moldura>
  )
}

/** Mensagem geral do formulário (conflito, falha de rede). Fica acima do botão de salvar. */
export function ErroDoFormulario({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null
  return (
    <p role="alert" className="rounded-lg border border-aviso-borda bg-aviso-fundo px-3 py-2 text-sm font-medium text-aviso">
      {mensagem}
    </p>
  )
}
