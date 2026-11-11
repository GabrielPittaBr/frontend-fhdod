import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import logo from '@/assets/logo.png'
import { CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { aplicarErroDaApi } from '@/lib/salvar'
import { Button } from '@/components/ui/button'
import { useSessao } from '@/stores/sessao'
import { sair, trocarSenha } from '../api'
import { senhaSchema, type DadosSenha } from '../schemas'

/** /painel/senha: troca de senha. Obrigatória no primeiro acesso, com a senha provisória. */
export default function SenhaPage() {
  const navegar = useNavigate()
  const obrigatoria = useSessao((s) => s.sessao?.usuario.trocarSenha ?? false)
  const form = useForm<DadosSenha>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmacao: '' },
  })
  const erros = form.formState.errors

  const troca = useMutation({
    mutationFn: ({ senhaAtual, novaSenha }: DadosSenha) => trocarSenha({ senhaAtual, novaSenha }),
    onSuccess: () => navegar('/painel', { replace: true }),
    onError: (erro) => aplicarErroDaApi(form, erro),
  })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
      <title>Trocar senha | FHDOD</title>
      <img src={logo} alt="FHDOD, Fundação Hospitalar Dr. Oswaldo Diesel" width={450} height={150} className="h-12 w-auto self-start" />
      <h1 className="mt-8 text-2xl font-bold">{obrigatoria ? 'Crie a sua senha' : 'Trocar senha'}</h1>
      <p className="mt-1 text-muted-foreground">
        {obrigatoria
          ? 'Você entrou com uma senha provisória. Antes de continuar, escolha uma senha que só você saiba.'
          : 'Depois da troca, os outros aparelhos em que você entrou pedem a senha de novo.'}
      </p>

      <form noValidate className="mt-6 grid gap-4" onSubmit={form.handleSubmit((dados) => troca.mutate(dados))}>
        <CampoTexto
          rotulo={obrigatoria ? 'Senha provisória' : 'Senha atual'}
          type="password"
          autoComplete="current-password"
          erro={erros.senhaAtual?.message}
          {...form.register('senhaAtual')}
        />
        <CampoTexto
          rotulo="Nova senha"
          type="password"
          autoComplete="new-password"
          dica="Pelo menos 10 caracteres, com letras e números."
          erro={erros.novaSenha?.message}
          {...form.register('novaSenha')}
        />
        <CampoTexto
          rotulo="Repita a nova senha"
          type="password"
          autoComplete="new-password"
          erro={erros.confirmacao?.message}
          {...form.register('confirmacao')}
        />
        <ErroDoFormulario mensagem={erros.root?.message} />
        <Button type="submit" size="lg" disabled={troca.isPending}>
          {troca.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
        {obrigatoria ? (
          <Button type="button" variant="ghost" onClick={() => void sair().then(() => navegar('/login'))}>
            Sair
          </Button>
        ) : (
          <Button asChild variant="ghost">
            <Link to="/painel">Voltar ao painel</Link>
          </Button>
        )}
      </form>
    </main>
  )
}
