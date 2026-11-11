// Guardas das rotas do painel. Só escondem telas: quem decide de verdade é a API.
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { Carregando, TelaMensagem } from '@/components/TelaMensagem'
import { Button } from '@/components/ui/button'
import { recuperarSessao } from '@/features/auth/api'
import type { Permissao } from '@/lib/api/tipos'
import { usePode, useSessao } from '@/stores/sessao'

/** Exige login. Ao recarregar a página, a sessão é recuperada pelo refresh, sem pedir a senha. */
export function ExigeSessao() {
  const sessao = useSessao((s) => s.sessao)
  const local = useLocation()
  const recuperacao = useQuery({
    queryKey: ['sessao'],
    queryFn: recuperarSessao,
    enabled: !sessao,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })

  if (sessao) {
    // primeiro acesso: nada do painel abre antes da troca da senha provisória
    if (sessao.usuario.trocarSenha && local.pathname !== '/painel/senha') return <Navigate to="/painel/senha" replace />
    return <Outlet />
  }
  if (recuperacao.isPending) return <Carregando texto="Abrindo o painel…" />
  if (recuperacao.isError) {
    return (
      <TelaMensagem titulo="Não deu para abrir o painel" acao={<Button onClick={() => recuperacao.refetch()}>Tentar de novo</Button>}>
        <p>Confira a internet e tente de novo.</p>
      </TelaMensagem>
    )
  }
  return <Navigate to="/login" replace state={{ de: local.pathname + local.search }} />
}

/** Mostra a página só para quem tem ao menos uma das permissões (vindas do /auth/me). */
export function ExigePermissao({ permissoes, children }: { permissoes: Permissao[]; children: ReactNode }) {
  if (usePode(...permissoes)) return children
  return (
    <div className="mx-auto max-w-xl py-10">
      <title>Sem acesso | Painel FHDOD</title>
      <h1 className="text-2xl font-bold">Você não tem acesso a esta página</h1>
      <p className="mt-2 text-muted-foreground">
        O seu perfil não inclui esta área do painel. Se precisar dela, fale com quem administra o sistema no hospital.
      </p>
      <Button asChild className="mt-6">
        <Link to="/painel">Voltar aos indicadores</Link>
      </Button>
    </div>
  )
}
