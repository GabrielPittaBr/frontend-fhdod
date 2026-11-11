import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, GripVertical, Pencil, Plus, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useParams } from 'react-router'
import { z } from 'zod'
import { DialogoFormulario } from '@/components/crud'
import { CampoSelecao, CampoTexto, ErroDoFormulario } from '@/components/formulario'
import { Bloco, Consulta, Pagina } from '@/components/layout/Pagina'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { listarCategorias } from '@/features/cadastros/api'
import { Pergunta as PerguntaDaPesquisa } from '@/features/pesquisa/components/Pergunta'
import { listarSetores } from '@/features/setores/api'
import type { Pergunta, TipoPergunta } from '@/lib/api/tipos'
import { ROTULO_TIPO_PERGUNTA } from '@/lib/rotulos'
import { aplicarErroDaApi, useSalvar } from '@/lib/salvar'
import { cn } from '@/lib/utils'
import { alterarStatusPergunta, criarPergunta, editarPergunta, listarPerguntas, salvarOrdem } from '../api'

const LIMITE_RECOMENDADO = 8
const TIPOS = Object.keys(ROTULO_TIPO_PERGUNTA) as TipoPergunta[]
const linhas = (texto: string) => texto.split('\n').map((l) => l.trim()).filter(Boolean)

const esquema = z
  .object({
    texto: z.string().trim().min(5, 'Escreva a pergunta').max(140, 'Use no máximo 140 caracteres: perguntas curtas são mais respondidas'),
    categoriaId: z.string().min(1, 'Escolha uma categoria'),
    tipo: z.enum(['ESCALA_1_5', 'SIM_NAO', 'MULTIPLA_ESCOLHA', 'TEXTO']),
    opcoes: z.string(),
  })
  .refine((d) => d.tipo !== 'MULTIPLA_ESCOLHA' || (linhas(d.opcoes).length >= 2 && linhas(d.opcoes).length <= 5), {
    path: ['opcoes'],
    message: 'Escreva de 2 a 5 opções, uma por linha',
  })
type Dados = z.infer<typeof esquema>

function Formulario({ setorId, pergunta, aoFechar }: { setorId: number; pergunta: Pergunta | null; aoFechar: () => void }) {
  const categorias = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias })
  const form = useForm<Dados>({
    resolver: zodResolver(esquema),
    defaultValues: {
      texto: pergunta?.texto ?? '',
      categoriaId: pergunta ? String(pergunta.categoriaId) : '',
      tipo: pergunta?.tipo ?? 'ESCALA_1_5',
      opcoes: pergunta?.opcoes?.join('\n') ?? '',
    },
  })
  const erros = form.formState.errors
  const tipo = useWatch({ control: form.control, name: 'tipo' })
  const tipoTravado = pergunta?.temRespostas ?? false

  const salvar = useSalvar(
    (d: Dados) => {
      const corpo = { texto: d.texto, categoriaId: Number(d.categoriaId), tipo: d.tipo, opcoes: d.tipo === 'MULTIPLA_ESCOLHA' ? linhas(d.opcoes) : null }
      return pergunta ? editarPergunta(pergunta.id, corpo) : criarPergunta(setorId, corpo)
    },
    {
      recarregar: ['perguntas'],
      sucesso: pergunta ? 'Pergunta atualizada' : 'Pergunta criada',
      aoConcluir: aoFechar,
      aoFalhar: (erro) => aplicarErroDaApi(form, erro),
    },
  )

  return (
    <DialogoFormulario
      aberto
      aoFechar={aoFechar}
      titulo={pergunta ? 'Editar pergunta' : 'Nova pergunta'}
      descricao="Pergunte uma coisa só, com palavras do dia a dia. Quem responde pode pular qualquer pergunta."
      rotuloSalvar={pergunta ? 'Salvar pergunta' : 'Criar pergunta'}
      salvando={salvar.isPending}
      aoEnviar={form.handleSubmit((d) => salvar.mutate(d))}
    >
      <CampoTexto rotulo="Pergunta" dica="Exemplo: Como foi o atendimento na recepção?" erro={erros.texto?.message} {...form.register('texto')} />
      <CampoSelecao rotulo="Categoria" dica="Permite comparar a mesma etapa entre setores." erro={erros.categoriaId?.message} {...form.register('categoriaId')}>
        <option value="">Escolha…</option>
        {categorias.data
          ?.filter((c) => c.ativa || c.id === pergunta?.categoriaId)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
      </CampoSelecao>
      <CampoSelecao
        rotulo="Tipo de resposta"
        disabled={tipoTravado}
        dica={tipoTravado ? 'Esta pergunta já tem respostas, então o tipo não muda mais. Para outro tipo, crie uma pergunta nova e desative esta.' : undefined}
        erro={erros.tipo?.message}
        {...form.register('tipo')}
      >
        {TIPOS.map((t) => (
          <option key={t} value={t}>
            {ROTULO_TIPO_PERGUNTA[t]}
          </option>
        ))}
      </CampoSelecao>
      {tipo === 'MULTIPLA_ESCOLHA' && (
        <div className="grid gap-1.5">
          <Label htmlFor="opcoes">Opções, uma por linha</Label>
          <Textarea id="opcoes" rows={4} aria-invalid={erros.opcoes ? true : undefined} aria-describedby={erros.opcoes ? 'opcoes-erro' : undefined} className="bg-card" {...form.register('opcoes')} />
          {erros.opcoes && (
            <p id="opcoes-erro" className="text-sm font-medium text-destructive">
              {erros.opcoes.message}
            </p>
          )}
        </div>
      )}
      <ErroDoFormulario mensagem={erros.root?.message} />
    </DialogoFormulario>
  )
}

/** Prévia no formato do celular, com os mesmos componentes que o paciente vê. */
function Previa({ pergunta }: { pergunta: Pergunta | undefined }) {
  return (
    <Bloco titulo="Prévia no celular" descricao="Toque em uma pergunta da lista para vê-la aqui." className="xl:sticky xl:top-20 xl:self-start">
      <div className="mx-auto w-full max-w-[21rem] rounded-[2rem] border-8 border-foreground bg-background p-4" aria-label="Prévia da pergunta">
        {pergunta ? (
          // a chave recria a prévia quando a pergunta muda de texto, tipo ou opções
          <div key={`${pergunta.id}-${pergunta.tipo}-${pergunta.opcoes?.join('|')}`} className="@container flex min-h-[26rem] flex-col text-lg">
            <p className="text-[1.375rem]/[1.2] font-bold text-balance">{pergunta.texto}</p>
            <div className="mt-5">
              <PerguntaDaPesquisa pergunta={pergunta} limiteTexto={500} aoResponder={() => undefined} />
            </div>
            <p className="mt-auto flex justify-between pt-5 font-semibold text-primary" aria-hidden>
              <span>Voltar</span>
              <span>Pular</span>
            </p>
          </div>
        ) : (
          <p className="flex min-h-[26rem] items-center text-center text-muted-foreground">Crie a primeira pergunta para ver a prévia.</p>
        )}
      </div>
    </Bloco>
  )
}

/** /painel/setores/:id/perguntas: perguntas do setor, na ordem da jornada do paciente. */
export default function PerguntasPage() {
  const setorId = Number(useParams().id)
  const clienteDeDados = useQueryClient()
  const chave = ['perguntas', setorId]
  const consulta = useQuery({ queryKey: chave, queryFn: () => listarPerguntas(setorId) })
  const setores = useQuery({ queryKey: ['setores'], queryFn: listarSetores })
  const categorias = useQuery({ queryKey: ['categorias'], queryFn: listarCategorias })
  const setor = setores.data?.find((s) => s.id === setorId)

  const [editando, setEditando] = useState<Pergunta | 'nova' | null>(null)
  const [naPrevia, setNaPrevia] = useState<number | null>(null)
  const [arrastando, setArrastando] = useState<number | null>(null)

  const ordem = useSalvar((ids: number[]) => salvarOrdem(setorId, ids), { recarregar: ['perguntas'] })
  const status = useSalvar(({ id, ativa }: { id: number; ativa: boolean }) => alterarStatusPergunta(id, ativa), { recarregar: ['perguntas'] })

  // ponytail: arrastar nativo do navegador (funciona com mouse). Toque e teclado usam as setas.
  // Se o arrastar por toque fizer falta, trocar por @dnd-kit.
  /** Move a pergunta e grava a nova ordem; a lista muda na hora, sem esperar a resposta. */
  function mover(de: number, para: number) {
    const lista = consulta.data
    if (!lista || para < 0 || para >= lista.length || de === para) return
    const nova = [...lista]
    nova.splice(para, 0, ...nova.splice(de, 1))
    clienteDeDados.setQueryData(chave, nova)
    ordem.mutate(nova.map((p) => p.id))
  }

  return (
    <Pagina
      titulo={setor ? `Perguntas: ${setor.nome}` : 'Perguntas do setor'}
      descricao="A pesquisa mostra as perguntas ativas nesta ordem, uma por tela, e termina com a nota de recomendação de 0 a 10, que é a única obrigatória."
      acoes={
        <>
          <Button asChild variant="outline">
            <Link to="/painel/setores">
              <ArrowLeft aria-hidden />
              Setores
            </Link>
          </Button>
          <Button onClick={() => setEditando('nova')}>
            <Plus aria-hidden />
            Nova pergunta
          </Button>
        </>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
        <Bloco>
          <Consulta consulta={consulta} altura="h-96" vazio={(lista) => lista.length === 0} textoVazio="Este setor ainda não tem perguntas. A pesquisa mostra só a nota de recomendação.">
            {(lista) => {
              const ativas = lista.filter((p) => p.ativa).length
              return (
                <>
                  {ativas > LIMITE_RECOMENDADO && (
                    <p className="mb-4 flex items-start gap-2 rounded-lg border border-aviso-borda bg-aviso-fundo px-3 py-2 text-sm text-aviso">
                      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                      <span>
                        Este setor tem {ativas} perguntas ativas. Acima de {LIMITE_RECOMENDADO}, mais gente desiste antes de chegar à nota final. Vale desativar as menos importantes.
                      </span>
                    </p>
                  )}
                  <p className="mb-3 text-sm text-muted-foreground">Para mudar a ordem, arraste a pergunta ou use as setas.</p>
                  <ol className="grid gap-2">
                    {lista.map((pergunta, i) => (
                      <li
                        key={pergunta.id}
                        draggable
                        onDragStart={() => setArrastando(i)}
                        onDragEnd={() => setArrastando(null)}
                        onDragOver={(evento) => evento.preventDefault()}
                        onDrop={() => arrastando !== null && mover(arrastando, i)}
                        className={cn(
                          'flex items-start gap-2 rounded-lg border bg-card p-2 sm:items-center',
                          arrastando === i && 'opacity-50',
                          (naPrevia ?? lista[0]?.id) === pergunta.id && 'border-primary',
                          !pergunta.ativa && 'bg-muted',
                        )}
                      >
                        <GripVertical aria-hidden className="mt-2.5 size-5 shrink-0 cursor-grab text-muted-foreground sm:mt-0" />
                        <button type="button" className="min-h-10 min-w-0 flex-1 rounded-md px-1 text-left" onClick={() => setNaPrevia(pergunta.id)}>
                          <span className={cn('block font-medium', !pergunta.ativa && 'text-muted-foreground')}>
                            {i + 1}. {pergunta.texto}
                          </span>
                          <span className="block text-sm text-muted-foreground">
                            {categorias.data?.find((c) => c.id === pergunta.categoriaId)?.nome ?? 'Sem categoria'}, {ROTULO_TIPO_PERGUNTA[pergunta.tipo].toLowerCase()}
                            {!pergunta.ativa && ' (inativa: não aparece na pesquisa)'}
                          </span>
                        </button>
                        <div className="flex shrink-0 flex-wrap justify-end gap-1">
                          <Button variant="ghost" size="icon" disabled={i === 0} aria-label={`Subir a pergunta ${i + 1}`} onClick={() => mover(i, i - 1)}>
                            <ArrowUp aria-hidden />
                          </Button>
                          <Button variant="ghost" size="icon" disabled={i === lista.length - 1} aria-label={`Descer a pergunta ${i + 1}`} onClick={() => mover(i, i + 1)}>
                            <ArrowDown aria-hidden />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Editar a pergunta ${i + 1}`} onClick={() => setEditando(pergunta)}>
                            <Pencil aria-hidden />
                          </Button>
                          <Button variant="outline" disabled={status.isPending} onClick={() => status.mutate({ id: pergunta.id, ativa: !pergunta.ativa })}>
                            {pergunta.ativa ? 'Desativar' : 'Ativar'}
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )
            }}
          </Consulta>
        </Bloco>
        <Previa pergunta={consulta.data?.find((p) => p.id === naPrevia) ?? consulta.data?.[0]} />
      </div>

      {editando && <Formulario setorId={setorId} pergunta={editando === 'nova' ? null : editando} aoFechar={() => setEditando(null)} />}
    </Pagina>
  )
}
