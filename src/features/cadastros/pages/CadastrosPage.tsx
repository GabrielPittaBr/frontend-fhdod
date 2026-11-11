import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { DialogoFormulario } from '@/components/crud'
import { CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { Bloco, Consulta, Pagina } from '@/components/layout/Pagina'
import { Button } from '@/components/ui/button'
import type { Categoria, Turno } from '@/lib/api/tipos'
import { horaFalada } from '@/lib/format'
import { aplicarErroDaApi, useSalvar } from '@/lib/salvar'
import { cn } from '@/lib/utils'
import { criarCategoria, criarTurno, editarCategoria, editarTurno, listarCategorias, listarTurnos } from '../api'

const esquemaCategoria = z.object({ nome: z.string().trim().min(2, 'Informe o nome da categoria') })
type DadosCategoria = z.infer<typeof esquemaCategoria>

function FormularioCategoria({ categoria, aoFechar }: { categoria: Categoria | null; aoFechar: () => void }) {
  const form = useForm<DadosCategoria>({ resolver: zodResolver(esquemaCategoria), defaultValues: { nome: categoria?.nome ?? '' } })
  const salvar = useSalvar((d: DadosCategoria) => (categoria ? editarCategoria(categoria.id, d) : criarCategoria(d.nome)), {
    recarregar: ['categorias'],
    sucesso: categoria ? 'Categoria atualizada' : 'Categoria criada',
    aoConcluir: aoFechar,
    aoFalhar: (erro) => aplicarErroDaApi(form, erro),
  })
  return (
    <DialogoFormulario
      aberto
      aoFechar={aoFechar}
      titulo={categoria ? 'Editar categoria' : 'Nova categoria'}
      descricao="A categoria agrupa perguntas da mesma etapa do atendimento em todos os setores."
      rotuloSalvar={categoria ? 'Salvar categoria' : 'Criar categoria'}
      salvando={salvar.isPending}
      aoEnviar={form.handleSubmit((d) => salvar.mutate(d))}
    >
      <CampoTexto rotulo="Nome da categoria" erro={form.formState.errors.nome?.message} {...form.register('nome')} />
      <ErroDoFormulario mensagem={form.formState.errors.root?.message} />
    </DialogoFormulario>
  )
}

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Informe a hora, como 07:00')
const esquemaTurno = z
  .object({ nome: z.string().trim().min(2, 'Informe o nome do turno'), horaInicio: hora, horaFim: hora })
  .refine((d) => d.horaInicio !== d.horaFim, { path: ['horaFim'], message: 'O fim precisa ser diferente do início' })
type DadosTurno = z.infer<typeof esquemaTurno>

function FormularioTurno({ turno, aoFechar }: { turno: Turno | null; aoFechar: () => void }) {
  const form = useForm<DadosTurno>({
    resolver: zodResolver(esquemaTurno),
    defaultValues: { nome: turno?.nome ?? '', horaInicio: turno?.horaInicio ?? '', horaFim: turno?.horaFim ?? '' },
  })
  const erros = form.formState.errors
  const salvar = useSalvar((d: DadosTurno) => (turno ? editarTurno(turno.id, d) : criarTurno(d)), {
    recarregar: ['turnos'],
    sucesso: turno ? 'Turno atualizado' : 'Turno criado',
    aoConcluir: aoFechar,
    aoFalhar: (erro) => aplicarErroDaApi(form, erro),
  })
  return (
    <DialogoFormulario
      aberto
      aoFechar={aoFechar}
      titulo={turno ? 'Editar turno' : 'Novo turno'}
      descricao="O totem escolhe o turno sozinho pelo horário. Se o fim for menor que o início, o turno atravessa a meia-noite."
      rotuloSalvar={turno ? 'Salvar turno' : 'Criar turno'}
      salvando={salvar.isPending}
      aoEnviar={form.handleSubmit((d) => salvar.mutate(d))}
    >
      <CampoTexto rotulo="Nome do turno" erro={erros.nome?.message} {...form.register('nome')} />
      <div className="grid grid-cols-2 gap-3">
        <CampoTexto rotulo="Começa às" type="time" erro={erros.horaInicio?.message} {...form.register('horaInicio')} />
        <CampoTexto rotulo="Termina às" type="time" erro={erros.horaFim?.message} {...form.register('horaFim')} />
      </div>
      <ErroDoFormulario mensagem={erros.root?.message} />
    </DialogoFormulario>
  )
}

/** /painel/cadastros: categorias e turnos, usados por todos os setores. */
export default function CadastrosPage() {
  const categorias = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias })
  const turnos = useQuery({ queryKey: ['turnos'], queryFn: listarTurnos })
  const [categoria, setCategoria] = useState<Categoria | 'nova' | null>(null)
  const [turno, setTurno] = useState<Turno | 'novo' | null>(null)
  const status = useSalvar(({ id, ativa }: { id: number; ativa: boolean }) => editarCategoria(id, { ativa }), { recarregar: ['categorias'] })

  return (
    <Pagina titulo="Categorias e turnos" descricao="Valem para todos os setores. Nada é apagado: o que sai de uso fica inativo e o histórico continua inteiro.">
      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <Bloco
          titulo="Categorias"
          descricao="Etapas do atendimento, para comparar setores."
          lateral={
            <Button variant="outline" onClick={() => setCategoria('nova')}>
              <Plus aria-hidden />
              Nova categoria
            </Button>
          }
        >
          <Consulta consulta={categorias} altura="h-64" vazio={(lista) => lista.length === 0} textoVazio="Nenhuma categoria cadastrada.">
            {(lista) => (
              <ul className="grid gap-2">
                {lista.map((c) => (
                  <li key={c.id} className={cn('flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2', !c.ativa && 'bg-muted')}>
                    <span className={cn('min-w-0 flex-1 font-medium', !c.ativa && 'text-muted-foreground')}>
                      {c.nome}
                      {!c.ativa && <span className="font-normal"> (inativa)</span>}
                    </span>
                    <Button variant="ghost" size="icon" aria-label={`Editar a categoria ${c.nome}`} onClick={() => setCategoria(c)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="outline" disabled={status.isPending} onClick={() => status.mutate({ id: c.id, ativa: !c.ativa })}>
                      {c.ativa ? 'Desativar' : 'Ativar'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Consulta>
        </Bloco>

        <Bloco
          titulo="Turnos"
          descricao="Horários provisórios, até o hospital confirmar os oficiais."
          lateral={
            <Button variant="outline" onClick={() => setTurno('novo')}>
              <Plus aria-hidden />
              Novo turno
            </Button>
          }
        >
          <Consulta consulta={turnos} altura="h-40" vazio={(lista) => lista.length === 0} textoVazio="Nenhum turno cadastrado.">
            {(lista) => (
              <ul className="grid gap-2">
                {lista.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{t.nome}</span>
                      <span className="numeros block text-sm text-muted-foreground">
                        das {horaFalada(t.horaInicio)} às {horaFalada(t.horaFim)}
                        {t.horaFim < t.horaInicio && ' do dia seguinte'}
                      </span>
                    </span>
                    <Button variant="ghost" size="icon" aria-label={`Editar o turno ${t.nome}`} onClick={() => setTurno(t)}>
                      <Pencil aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Consulta>
        </Bloco>
      </div>

      {categoria && <FormularioCategoria categoria={categoria === 'nova' ? null : categoria} aoFechar={() => setCategoria(null)} />}
      {turno && <FormularioTurno turno={turno === 'novo' ? null : turno} aoFechar={() => setTurno(null)} />}
    </Pagina>
  )
}
