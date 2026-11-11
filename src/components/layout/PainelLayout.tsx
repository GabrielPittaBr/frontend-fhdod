import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, ChartColumn, ChevronDown, KeyRound, LogOut, Menu, MessagesSquare, PhoneCall, RotateCcw, Tags, Tv, Users, type LucideIcon } from 'lucide-react'
import { Suspense, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { toast } from 'sonner'
import logo from '@/assets/logo.png'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { restaurarDadosDemo, sair } from '@/features/auth/api'
import type { Permissao } from '@/lib/api/tipos'
import { mensagemDeErro } from '@/lib/api/erro'
import { ROTULO_PERFIL } from '@/lib/rotulos'
import { cn } from '@/lib/utils'
import { useSessao } from '@/stores/sessao'

interface ItemDoMenu {
  para: string
  rotulo: string
  icone: LucideIcon
  /** basta ter uma delas */
  permissoes: Permissao[]
}

// Dois grupos: acompanhar os resultados e configurar a pesquisa.
const MENU: ItemDoMenu[][] = [
  [
    { para: '/painel', rotulo: 'Indicadores', icone: ChartColumn, permissoes: ['dashboard:ver'] },
    { para: '/painel/respostas', rotulo: 'Respostas', icone: MessagesSquare, permissoes: ['respostas:ver'] },
    { para: '/painel/contatos', rotulo: 'Pedidos de retorno', icone: PhoneCall, permissoes: ['contatos:ver'] },
  ],
  [
    { para: '/painel/setores', rotulo: 'Setores e perguntas', icone: Building2, permissoes: ['setores:gerenciar', 'perguntas:gerenciar'] },
    { para: '/painel/cadastros', rotulo: 'Categorias e turnos', icone: Tags, permissoes: ['categorias:gerenciar', 'turnos:gerenciar'] },
    { para: '/painel/usuarios', rotulo: 'Usuários', icone: Users, permissoes: ['usuarios:gerenciar'] },
    { para: '/painel/tv', rotulo: 'Telas de TV', icone: Tv, permissoes: ['tvwall:gerenciar'] },
  ],
]

/** O menu mostra só o que o usuário pode acessar, pela lista de permissões do /auth/me. */
function Navegacao({ aoNavegar }: { aoNavegar?: () => void }) {
  const permissoes = useSessao((s) => s.sessao?.permissoes ?? [])
  const grupos = MENU.map((grupo) => grupo.filter((item) => item.permissoes.some((p) => permissoes.includes(p)))).filter(
    (grupo) => grupo.length > 0,
  )
  return (
    <nav aria-label="Menu do painel" className="grid gap-3">
      {grupos.map((grupo, i) => (
        <ul key={i} className={cn('grid gap-1', i > 0 && 'border-t pt-3')}>
          {grupo.map(({ para, rotulo, icone: Icone }) => (
            <li key={para}>
              <NavLink
                to={para}
                end={para === '/painel'}
                onClick={aoNavegar}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] transition-colors',
                    isActive ? 'bg-secondary font-semibold text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                <Icone aria-hidden className="size-5 shrink-0" />
                {rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      ))}
    </nav>
  )
}

function MenuDoUsuario() {
  const navegar = useNavigate()
  const clienteDeDados = useQueryClient()
  const sessao = useSessao((s) => s.sessao)
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false)

  const restauracao = useMutation({
    mutationFn: restaurarDadosDemo,
    onSuccess: () => {
      void clienteDeDados.invalidateQueries()
      toast.success('Dados de demonstração restaurados')
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  if (!sessao) return null
  const { usuario, setores, todosSetores, permissoes } = sessao

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto min-h-11 max-w-full gap-2 px-2 py-1 text-left">
            <span className="min-w-0">
              <span className="block truncate font-semibold">{usuario.nome}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {ROTULO_PERFIL[usuario.perfil]}
                {/* quem não vê todos os setores enxerga aqui quais são os seus */}
                {!todosSetores && `: ${setores.map((s) => s.nome).join(', ') || 'nenhum setor vinculado'}`}
              </span>
            </span>
            <ChevronDown aria-hidden className="shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-60">
          <DropdownMenuItem className="min-h-10" onSelect={() => navegar('/painel/senha')}>
            <KeyRound aria-hidden />
            Trocar senha
          </DropdownMenuItem>
          {permissoes.includes('setores:gerenciar') && (
            <DropdownMenuItem className="min-h-10" onSelect={() => setConfirmandoRestauracao(true)}>
              <RotateCcw aria-hidden />
              Restaurar dados de demonstração
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="min-h-10" onSelect={() => void sair().then(() => navegar('/login'))}>
            <LogOut aria-hidden />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmandoRestauracao} onOpenChange={setConfirmandoRestauracao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar os dados de demonstração?</AlertDialogTitle>
            <AlertDialogDescription>
              As respostas enviadas neste navegador e as mudanças em setores, perguntas, usuários e telas serão apagadas. Não dá para desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => restauracao.mutate()}>Restaurar dados</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/** Moldura do painel: menu lateral no computador, recolhível no celular e no tablet. */
export default function PainelLayout() {
  const [menuAberto, setMenuAberto] = useState(false)
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2">
        Pular para o conteúdo
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-r bg-card p-4 lg:flex print:hidden">
        <img src={logo} alt="FHDOD, Fundação Hospitalar Dr. Oswaldo Diesel" width={450} height={150} className="h-11 w-auto self-start" />
        <Navegacao />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-card px-3 sm:px-6 print:hidden">
          <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir o menu">
                <Menu aria-hidden className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-6 p-4">
              <SheetHeader className="p-0">
                <SheetTitle>
                  <img src={logo} alt="FHDOD" width={450} height={150} className="h-10 w-auto" />
                </SheetTitle>
                <SheetDescription className="sr-only">Menu do painel</SheetDescription>
              </SheetHeader>
              <Navegacao aoNavegar={() => setMenuAberto(false)} />
            </SheetContent>
          </Sheet>
          <img src={logo} alt="" width={450} height={150} className="h-8 w-auto lg:hidden" />
          <div className="ml-auto min-w-0">
            <MenuDoUsuario />
          </div>
        </header>

        <main id="conteudo" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<Skeleton className="mx-auto h-64 w-full max-w-6xl" />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <Toaster position="top-center" />
    </div>
  )
}
