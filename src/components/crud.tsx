// Peças repetidas nas telas de cadastro: diálogo de formulário e campo com botão de copiar.
import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { copiar } from '@/lib/salvar'

/** Diálogo com um formulário: título, campos e os botões Cancelar e salvar. */
export function DialogoFormulario({
  aberto,
  aoFechar,
  titulo,
  descricao,
  rotuloSalvar,
  salvando,
  aoEnviar,
  children,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: ReactNode
  rotuloSalvar: string
  salvando: boolean
  aoEnviar: React.FormEventHandler<HTMLFormElement>
  children: ReactNode
}) {
  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <form noValidate onSubmit={aoEnviar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {/* sem descrição visível, o leitor de tela ainda recebe o título como contexto */}
            <DialogDescription className={descricao ? undefined : 'sr-only'}>{descricao ?? titulo}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : rotuloSalvar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Texto que precisa ser copiado (link, senha provisória), com o botão ao lado. */
export function CampoCopiavel({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{rotulo}</span>
      <div className="flex gap-2">
        <code className="min-w-0 flex-1 rounded-lg border bg-muted px-3 py-2 text-sm break-all select-all">{valor}</code>
        <Button type="button" variant="outline" onClick={() => void copiar(valor, rotulo)}>
          Copiar
        </Button>
      </div>
    </div>
  )
}

/** Pergunta antes de uma ação que não dá para desfazer. */
export function Confirmacao({
  aberta,
  aoFechar,
  titulo,
  descricao,
  rotuloConfirmar,
  aoConfirmar,
}: {
  aberta: boolean
  aoFechar: () => void
  titulo: string
  descricao: string
  rotuloConfirmar: string
  aoConfirmar: () => void
}) {
  return (
    <AlertDialog open={aberta} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={aoConfirmar}>{rotuloConfirmar}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
