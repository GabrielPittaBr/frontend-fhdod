import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Ação principal da tela: alta (56 px) e larga, para ninguém errar o toque. */
export function BotaoPrincipal({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-xl font-semibold text-primary-foreground',
        'transition-[background-color,transform] duration-150 hover:bg-[#08575a] active:translate-y-px active:scale-[0.985]',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
}

/** Ações de apoio (Voltar, Pular, Agora não): sempre no mesmo lugar em todas as telas. */
export function BotaoDiscreto({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-lg font-semibold text-primary',
        'transition-[background-color,transform] duration-150 hover:bg-secondary active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45',
        className,
      )}
      {...props}
    />
  )
}

/** Opção de uma lista (sim/não, múltipla escolha, data, turno). */
export function Opcao({
  selecionada = false,
  apagada = false,
  detalhe,
  children,
  className,
  ...props
}: ComponentProps<'button'> & { selecionada?: boolean; apagada?: boolean; detalhe?: string }) {
  return (
    <button
      type="button"
      aria-pressed={selecionada}
      className={cn(
        'flex min-h-16 w-full items-center gap-4 rounded-2xl border-2 bg-card px-5 py-3 text-left',
        'transition-[background-color,border-color,opacity,transform] duration-150 active:scale-[0.985]',
        selecionada ? 'border-primary bg-secondary' : 'border-input hover:border-primary',
        apagada && 'opacity-40',
        className,
      )}
      {...props}
    >
      <span className="flex-1">
        <span className="block text-xl font-semibold">{children}</span>
        {detalhe && <span className="block text-lg text-muted-foreground">{detalhe}</span>}
      </span>
      {selecionada && <Check aria-hidden className="size-7 shrink-0 text-primary" strokeWidth={3} />}
    </button>
  )
}
