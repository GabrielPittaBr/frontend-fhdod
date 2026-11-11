import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import logo from '@/assets/logo.png'
import { CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { aplicarErroDaApi } from '@/lib/salvar'
import { Button } from '@/components/ui/button'
import { useSessao } from '@/stores/sessao'
import { entrar, listarAcessosDemo } from '../api'
import { loginSchema, type DadosLogin } from '../schemas'

/** /login: entrada do painel da gestão. */
export default function LoginPage() {
  const navegar = useNavigate()
  const destino = (useLocation().state as { de?: string } | null)?.de ?? '/painel'
  const logado = useSessao((s) => s.sessao !== null)
  const form = useForm<DadosLogin>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', senha: '' } })

  const login = useMutation({
    mutationFn: (dados: DadosLogin) => entrar(dados.email, dados.senha),
    onSuccess: () => navegar(destino, { replace: true }),
    onError: (erro) => aplicarErroDaApi(form, erro),
  })

  if (logado && !login.isSuccess) return <Navigate to={destino} replace />

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <title>Entrar no painel | FHDOD</title>
      <img src={logo} alt="FHDOD, Fundação Hospitalar Dr. Oswaldo Diesel" width={450} height={150} className="h-12 w-auto self-start" />
      <h1 className="mt-8 text-2xl font-bold">Painel da pesquisa de satisfação</h1>
      <p className="mt-1 text-muted-foreground">Entre com o e-mail e a senha que o hospital criou para você.</p>

      <form noValidate className="mt-6 grid gap-4" onSubmit={form.handleSubmit((dados) => login.mutate(dados))}>
        <CampoTexto
          rotulo="E-mail"
          type="email"
          autoComplete="username"
          spellCheck={false}
          erro={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        <CampoTexto
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          erro={form.formState.errors.senha?.message}
          {...form.register('senha')}
        />
        <ErroDoFormulario mensagem={form.formState.errors.root?.message} />
        <Button type="submit" size="lg" disabled={login.isPending}>
          {login.isPending ? 'Entrando…' : 'Entrar no painel'}
        </Button>
      </form>

      <AcessosDemo ocupado={login.isPending} aoEscolher={(dados) => login.mutate(dados)} />
    </main>
  )
}

/** Só enquanto os dados são simulados: entra como cada perfil com um toque. Some quando a API chegar. */
function AcessosDemo({ ocupado, aoEscolher }: { ocupado: boolean; aoEscolher: (dados: DadosLogin) => void }) {
  const demo = listarAcessosDemo()
  return (
    <section aria-labelledby="demo" className="mt-10 border-t pt-6">
      <h2 id="demo" className="font-semibold">
        Demonstração com dados simulados
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Escolha um perfil para entrar sem digitar a senha.</p>
      <ul className="mt-3 grid gap-2">
        {demo.usuarios.map((acesso) => (
          <li key={acesso.email}>
            <button
              type="button"
              disabled={ocupado}
              onClick={() => aoEscolher({ email: acesso.email, senha: acesso.senha })}
              className="flex min-h-12 w-full flex-wrap items-baseline gap-x-2 rounded-lg border border-input/60 bg-card px-3 py-2 text-left transition-colors hover:bg-muted active:translate-y-px disabled:opacity-50"
            >
              <span className="font-semibold">{acesso.rotulo}</span>
              <span className="text-sm text-muted-foreground">{acesso.descricao}</span>
            </button>
          </li>
        ))}
      </ul>
      <ul className="mt-4 grid gap-1 text-sm">
        {demo.links.map((link) => (
          <li key={link.url}>
            <Link to={link.url} className="inline-flex min-h-9 items-center font-semibold text-primary underline underline-offset-4 hover:no-underline">
              {link.rotulo}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
