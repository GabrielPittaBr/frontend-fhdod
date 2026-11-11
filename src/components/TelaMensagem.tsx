import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import logo from '@/assets/logo.png'

/** Tela simples de aviso (não encontrado, sem acesso, erro): mensagem amigável, sem detalhe técnico. */
export function TelaMensagem({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col justify-center px-6 py-10 text-lg">
      <img src={logo} alt="FHDOD, Fundação Hospitalar Dr. Oswaldo Diesel" width={450} height={150} className="h-10 w-auto self-start" />
      <h1 className="mt-8 text-[1.75rem]/[1.2] font-bold text-balance">{titulo}</h1>
      {children && <div className="mt-3 text-muted-foreground">{children}</div>}
      {acao && <div className="mt-8">{acao}</div>}
    </main>
  )
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-4 text-lg text-muted-foreground">
      <LoaderCircle aria-hidden className="size-9 animate-spin text-primary" />
      {texto}
    </div>
  )
}
