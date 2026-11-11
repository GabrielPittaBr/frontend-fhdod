import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { KeyRound, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { CampoCopiavel, Confirmacao, DialogoFormulario } from '@/components/crud'
import { CampoSelecao, CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { Bloco, Consulta, Pagina } from '@/components/layout/Pagina'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { listarSetores } from '@/features/setores/api'
import type { Perfil, Usuario } from '@/lib/api/tipos'
import { dataHora } from '@/lib/format'
import { ROTULO_PERFIL } from '@/lib/rotulos'
import { aplicarErroDaApi, useSalvar } from '@/lib/salvar'
import { cn } from '@/lib/utils'
import { useSessao } from '@/stores/sessao'
import { alterarStatusUsuario, criarUsuario, definirSetores, editarUsuario, listarUsuarios, redefinirSenha } from '../api'

const PERFIS = Object.keys(ROTULO_PERFIL) as Perfil[]
/** Estes perfis enxergam só os setores vinculados; os outros veem todos. */
const PERFIS_POR_SETOR: Perfil[] = ['GESTOR', 'VISUALIZADOR']
const O_QUE_FAZ: Record<Perfil, string> = {
  SUPER_ADMIN: 'Vê e gerencia tudo, inclusive usuários e telefones.',
  GESTOR: 'Vê indicadores e respostas dos seus setores e edita as perguntas deles.',
  OUVIDORIA: 'Vê todos os setores, as respostas e os telefones de retorno.',
  VISUALIZADOR: 'Vê só os indicadores dos seus setores, sem comentários.',
}

const esquema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome completo'),
  email: z.email('Digite um e-mail válido'),
  perfil: z.enum(['SUPER_ADMIN', 'GESTOR', 'OUVIDORIA', 'VISUALIZADOR']),
  setorIds: z.array(z.string()),
})
type Dados = z.infer<typeof esquema>

function Formulario({ usuario, aoFechar, aoCriar }: { usuario: Usuario | null; aoFechar: () => void; aoCriar: (senha: Senha) => void }) {
  const setores = useQuery({ queryKey: ['setores'], queryFn: listarSetores })
  const form = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: {
      nome: usuario?.nome ?? '',
      email: usuario?.email ?? '',
      perfil: usuario?.perfil ?? 'GESTOR',
      setorIds: usuario?.setorIds.map(String) ?? [],
    },
  })
  const erros = form.formState.errors
  const perfil = useWatch({ control: form.control, name: 'perfil' })
  const porSetor = PERFIS_POR_SETOR.includes(perfil)

  const salvar = useSalvar(
    async (d: Dados) => {
      const setorIds = PERFIS_POR_SETOR.includes(d.perfil) ? d.setorIds.map(Number) : []
      if (usuario) {
        await editarUsuario(usuario.id, { nome: d.nome, perfil: d.perfil })
        await definirSetores(usuario.id, setorIds)
        return null
      }
      const criado = await criarUsuario({ nome: d.nome, email: d.email, perfil: d.perfil })
      await definirSetores(criado.usuario.id, setorIds)
      return { nome: criado.usuario.nome, email: criado.usuario.email, senha: criado.senhaProvisoria }
    },
    {
      recarregar: ['usuarios'],
      sucesso: usuario ? 'Usuário atualizado' : undefined,
      aoConcluir: (senha) => {
        aoFechar()
        if (senha) aoCriar(senha)
      },
      aoFalhar: (erro) => aplicarErroDaApi(form, erro),
    },
  )

  return (
    <DialogoFormulario
      aberto
      aoFechar={aoFechar}
      titulo={usuario ? `Editar ${usuario.nome}` : 'Novo usuário'}
      descricao={usuario ? 'O e-mail não muda. Para trocar a senha, use "Redefinir senha".' : 'O sistema cria uma senha provisória. A pessoa troca no primeiro acesso.'}
      rotuloSalvar={usuario ? 'Salvar usuário' : 'Criar usuário'}
      salvando={salvar.isPending}
      aoEnviar={form.handleSubmit((d) => salvar.mutate(d))}
    >
      <CampoTexto rotulo="Nome completo" autoComplete="off" erro={erros.nome?.message} {...form.register('nome')} />
      <CampoTexto rotulo="E-mail" type="email" autoComplete="off" spellCheck={false} disabled={!!usuario} erro={erros.email?.message} {...form.register('email')} />
      <CampoSelecao rotulo="Perfil" dica={O_QUE_FAZ[perfil]} erro={erros.perfil?.message} {...form.register('perfil')}>
        {PERFIS.map((p) => (
          <option key={p} value={p}>
            {ROTULO_PERFIL[p]}
          </option>
        ))}
      </CampoSelecao>
      {porSetor && (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Setores que esta pessoa acompanha</legend>
          {setores.data?.map((s) => (
            <label key={s.id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg border px-3 has-checked:border-primary has-checked:bg-secondary">
              <input type="checkbox" value={s.id} className="size-5 accent-primary" {...form.register('setorIds')} />
              {s.nome}
              {!s.ativo && <span className="text-sm text-muted-foreground">(inativo)</span>}
            </label>
          ))}
        </fieldset>
      )}
      <ErroDoFormulario mensagem={erros.root?.message} />
    </DialogoFormulario>
  )
}

interface Senha {
  nome: string
  email: string
  senha: string
}

/** A senha provisória aparece uma única vez, logo depois de criada. */
function SenhaProvisoria({ dados, aoFechar }: { dados: Senha; aoFechar: () => void }) {
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Senha provisória de {dados.nome}</DialogTitle>
          <DialogDescription>Anote ou copie agora: ela não aparece de novo. No primeiro acesso, o sistema pede uma senha nova.</DialogDescription>
        </DialogHeader>
        <CampoCopiavel rotulo="E-mail" valor={dados.email} />
        <CampoCopiavel rotulo="Senha provisória" valor={dados.senha} />
        <DialogFooter>
          <Button onClick={aoFechar}>Já anotei</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** /painel/usuarios: quem entra no painel e o que cada pessoa enxerga. */
export default function UsuariosPage() {
  const consulta = useQuery({ queryKey: ['usuarios'], queryFn: listarUsuarios })
  const setores = useQuery({ queryKey: ['setores'], queryFn: listarSetores })
  const meuId = useSessao((s) => s.sessao?.usuario.id)
  const [editando, setEditando] = useState<Usuario | 'novo' | null>(null)
  const [senha, setSenha] = useState<Senha | null>(null)
  const [redefinindo, setRedefinindo] = useState<Usuario | null>(null)

  const status = useSalvar(({ id, ativo }: { id: number; ativo: boolean }) => alterarStatusUsuario(id, ativo), {
    recarregar: ['usuarios'],
    sucesso: 'Situação do usuário atualizada',
  })
  const redefinicao = useSalvar(async (u: Usuario) => ({ nome: u.nome, email: u.email, senha: await redefinirSenha(u.id) }), {
    recarregar: ['usuarios'],
    aoConcluir: setSenha,
  })
  const nomesDosSetores = (ids: number[]) => ids.map((id) => setores.data?.find((s) => s.id === id)?.nome).filter(Boolean).join(', ')

  return (
    <Pagina
      titulo="Usuários"
      descricao="Cada pessoa vê só o que o seu perfil permite. Desativar alguém encerra as sessões abertas na hora."
      acoes={
        <Button onClick={() => setEditando('novo')}>
          <Plus aria-hidden />
          Novo usuário
        </Button>
      }
    >
      <Bloco>
        <Consulta consulta={consulta} altura="h-80">
          {(usuarios) => (
            <ul className="grid gap-3">
              {usuarios.map((u) => (
                <li key={u.id} className={cn('grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center', !u.ativo && 'bg-muted')}>
                  <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 font-semibold">
                      {u.nome}
                      <span className="rounded-md border border-input/50 px-1.5 text-xs leading-6 font-medium">{ROTULO_PERFIL[u.perfil]}</span>
                      {!u.ativo && <span className="rounded-md border border-aviso-borda bg-aviso-fundo px-1.5 text-xs leading-6 font-medium text-aviso">Inativo</span>}
                      {u.trocarSenha && u.ativo && <span className="rounded-md border border-input/50 px-1.5 text-xs leading-6 font-medium">Com senha provisória</span>}
                    </h2>
                    <p className="text-sm break-all text-muted-foreground">{u.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {PERFIS_POR_SETOR.includes(u.perfil) ? `Setores: ${nomesDosSetores(u.setorIds) || 'nenhum vinculado ainda'}.` : 'Todos os setores.'}{' '}
                      {u.ultimoLoginEm ? `Último acesso em ${dataHora(u.ultimoLoginEm)}.` : 'Ainda não entrou.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setEditando(u)}>
                      <Pencil aria-hidden />
                      Editar
                    </Button>
                    <Button variant="outline" disabled={redefinicao.isPending} onClick={() => setRedefinindo(u)}>
                      <KeyRound aria-hidden />
                      Redefinir senha
                    </Button>
                    <Button variant="outline" disabled={status.isPending || u.id === meuId} onClick={() => status.mutate({ id: u.id, ativo: !u.ativo })}>
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Consulta>
      </Bloco>

      {editando && <Formulario usuario={editando === 'novo' ? null : editando} aoFechar={() => setEditando(null)} aoCriar={setSenha} />}
      <Confirmacao
        aberta={redefinindo !== null}
        aoFechar={() => setRedefinindo(null)}
        titulo={redefinindo ? 'Redefinir a senha de ' + redefinindo.nome + '?' : 'Redefinir a senha?'}
        descricao="A senha atual deixa de valer e as sessões abertas desta pessoa são encerradas. O sistema mostra uma senha provisória para você entregar a ela."
        rotuloConfirmar="Redefinir senha"
        aoConfirmar={() => redefinindo && redefinicao.mutate(redefinindo)}
      />
      {senha && <SenhaProvisoria dados={senha} aoFechar={() => setSenha(null)} />}
    </Pagina>
  )
}
