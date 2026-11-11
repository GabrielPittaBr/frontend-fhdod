import type { ComponentProps, ReactNode } from 'react'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'
import { BarraProgresso } from './BarraProgresso'

/**
 * Moldura de todas as telas da pesquisa: logo e progresso em cima, conteúdo no meio e,
 * embaixo, "Voltar" sempre à esquerda e "Pular" sempre à direita.
 */
export function Moldura({ progresso, rodape, children }: { progresso?: number; rodape?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-5 pt-4 pb-5 text-lg alta:justify-center sm:px-8 sm:pt-6 sm:pb-8">
      <header className="flex h-10 items-center gap-5">
        <img src={logo} alt="FHDOD, Fundação Hospitalar Dr. Oswaldo Diesel" width={450} height={150} className="h-9 w-auto" />
        {progresso !== undefined && <BarraProgresso valor={progresso} />}
      </header>
      <main className="@container flex flex-1 flex-col pt-7 alta:min-h-[30rem] alta:flex-none sm:pt-10">{children}</main>
      <footer className="mt-5 flex min-h-12 items-center justify-between gap-3">{rodape}</footer>
    </div>
  )
}

/** Título da tela. Recebe o foco a cada etapa, para o leitor de tela anunciar a nova pergunta. */
export function Titulo({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <h1
      tabIndex={-1}
      className={cn('text-[1.625rem]/[1.2] font-bold text-balance outline-none sm:text-[2rem]/[1.15]', className)}
      {...props}
    />
  )
}

/** Aviso de erro: âmbar com ícone e texto, nunca o vermelho da marca. */
export function Aviso({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn('rounded-xl border border-aviso-borda bg-aviso-fundo px-4 py-3 text-lg font-medium text-aviso', className)}>
      {children}
    </p>
  )
}
