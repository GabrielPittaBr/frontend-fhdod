import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  createColumnHelper,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown, MessageSquareText, PhoneCall } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { classeDaSelecao } from '@/components/formulario'
import { Bloco, Consulta, Pagina } from '@/components/layout/Pagina'
import { SeloClassificacao, SeloComentario } from '@/components/Selos'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Filtro, Filtros } from '@/features/dashboard/components/Filtros'
import { useFiltros } from '@/features/dashboard/filtros'
import type { Classificacao, FiltrosRespostas, RespostaResumo } from '@/lib/api/tipos'
import { NIVEIS } from '@/lib/escala'
import { dataCurta, dataHora, numero } from '@/lib/format'
import { ROTULO_CANAL } from '@/lib/rotulos'
import { usePode } from '@/stores/sessao'
import { buscarResposta, listarRespostas } from '../api'

// A ordenação e a paginação são feitas pela API (aqui, pelo mock): a tabela só mostra a página recebida.
const recursos = tableFeatures({ rowSortingFeature, rowPaginationFeature })
const coluna = createColumnHelper<typeof recursos, RespostaResumo>()
const SEM_LINHAS: RespostaResumo[] = []

const colunas = coluna.columns([
  coluna.accessor('dataAtendimento', {
    header: 'Atendimento',
    cell: (c) => (
      <>
        <span className="numeros block">{dataCurta(c.getValue())}</span>
        <span className="block text-xs text-muted-foreground">{c.row.original.turno}</span>
      </>
    ),
  }),
  coluna.accessor('setor', { header: 'Setor', enableSorting: false }),
  coluna.accessor('canal', { header: 'Canal', enableSorting: false, cell: (c) => ROTULO_CANAL[c.getValue()] }),
  coluna.accessor('nps', { header: 'Nota de 0 a 10', cell: (c) => <strong className="numeros">{c.getValue()}</strong> }),
  coluna.accessor('classificacao', { header: 'Classificação', enableSorting: false, cell: (c) => <SeloClassificacao valor={c.getValue()} /> }),
  coluna.display({
    id: 'extras',
    header: 'Comentário e retorno',
    cell: ({ row }) => (
      <span className="flex gap-3 text-muted-foreground">
        {row.original.temComentario && (
          <span className="flex items-center gap-1">
            <MessageSquareText aria-hidden className="size-4" /> Comentou
          </span>
        )}
        {row.original.pediuRetorno && (
          <span className="flex items-center gap-1">
            <PhoneCall aria-hidden className="size-4" /> Pediu retorno
          </span>
        )}
      </span>
    ),
  }),
  coluna.accessor('enviadoEm', { header: 'Enviada em', cell: (c) => dataHora(c.getValue()) }),
])

/** Detalhe de uma resposta: as perguntas e notas como o paciente viu, o comentário e o telefone mascarado. */
function Detalhe({ id, aoFechar }: { id: number | null; aoFechar: () => void }) {
  const consulta = useQuery({ queryKey: ['respostas', 'detalhe', id], queryFn: () => buscarResposta(id!), enabled: id !== null })
  const veContatos = usePode('contatos:ver')
  return (
    <Sheet open={id !== null} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-5 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
        <SheetHeader className="p-0 pr-8">
          <SheetTitle className="text-lg">Resposta {id}</SheetTitle>
          <SheetDescription>O que a pessoa respondeu, na ordem em que as perguntas apareceram.</SheetDescription>
        </SheetHeader>
        <div className="mt-5 text-base">
          <Consulta consulta={consulta} altura="h-80">
            {(r) => (
              <div className="grid gap-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ['Setor', r.setor],
                    ['Atendimento', `${dataCurta(r.dataAtendimento)}, ${r.turno.toLowerCase()}`],
                    ['Canal', ROTULO_CANAL[r.canal]],
                    ['Enviada em', dataHora(r.enviadoEm)],
                  ].map(([termo, valor]) => (
                    <div key={termo}>
                      <dt className="text-muted-foreground">{termo}</dt>
                      <dd className="font-medium">{valor}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Recomendaria o hospital (0 a 10)</p>
                    <p className="text-3xl font-bold">{r.nps}</p>
                  </div>
                  <SeloClassificacao valor={r.classificacao} />
                </div>

                <section>
                  <h3 className="text-sm font-semibold">Perguntas respondidas</h3>
                  {r.itens.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">A pessoa pulou as perguntas do setor e deu só a nota de recomendação.</p>
                  ) : (
                    <ul className="mt-2 grid gap-3">
                      {r.itens.map((item) => {
                        const nivel = NIVEIS.find((n) => n.valor === item.valorNumero)
                        return (
                          <li key={item.perguntaId} className="border-t pt-3 first:border-t-0 first:pt-0">
                            <p className="text-sm text-muted-foreground">{item.categoria}</p>
                            <p>{item.perguntaTexto}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-2 font-semibold">
                              {nivel ? (
                                <>
                                  <img src={nivel.imagem} alt="" width={24} height={24} className="size-6" />
                                  {nivel.valor}, {nivel.rotulo}
                                  {item.classificacao && item.classificacao !== 'NORMAL' && <SeloClassificacao valor={item.classificacao} />}
                                </>
                              ) : item.tipo === 'SIM_NAO' ? (
                                item.valorTexto === 'SIM' ? 'Sim' : 'Não'
                              ) : (
                                item.valorTexto
                              )}
                            </p>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </section>

                {r.comentario && (
                  <section>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      Comentário <SeloComentario tipo={r.comentario.tipo} />
                    </h3>
                    <p className="mt-2 rounded-lg border bg-muted p-3">{r.comentario.texto}</p>
                  </section>
                )}

                {r.contato && (
                  <section>
                    <h3 className="text-sm font-semibold">Pedido de retorno</h3>
                    <p className="numeros mt-1">Telefone {r.contato.telefoneMascarado}</p>
                    {veContatos ? (
                      <Button asChild variant="outline" className="mt-2">
                        <Link to="/painel/contatos">Abrir os pedidos de retorno</Link>
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">O número completo fica visível só para a Ouvidoria.</p>
                    )}
                  </section>
                )}
              </div>
            )}
          </Consulta>
        </div>
      </SheetContent>
    </Sheet>
  )
}

const SIM_NAO = { sim: true, nao: false } as const

/** /painel/respostas: cada resposta, com filtros, ordenação e paginação. */
export default function RespostasPage() {
  const estado = useFiltros()
  const { filtros, alterar, params } = estado
  const [ordenacao, setOrdenacao] = useState<SortingState>([{ id: 'enviadoEm', desc: true }])
  const [pagina, setPagina] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })
  // estes filtros também moram na URL, junto com os do dashboard
  const classificacao = (params.get('classificacao') as Classificacao | null) ?? undefined
  const comComentario = SIM_NAO[params.get('comentario') as keyof typeof SIM_NAO]
  const comRetorno = SIM_NAO[params.get('retorno') as keyof typeof SIM_NAO]
  const aberta = Number(params.get('resposta')) || null

  const pedido: FiltrosRespostas = {
    ...filtros,
    classificacao,
    comComentario,
    comRetorno,
    pagina: pagina.pageIndex + 1,
    porPagina: pagina.pageSize,
    ordenarPor: (ordenacao[0]?.id as FiltrosRespostas['ordenarPor']) ?? 'enviadoEm',
    ordem: ordenacao[0]?.desc === false ? 'asc' : 'desc',
  }
  const consulta = useQuery({ queryKey: ['respostas', 'lista', pedido], queryFn: () => listarRespostas(pedido), placeholderData: keepPreviousData })
  const total = consulta.data?.meta.total ?? 0

  /** Mudar um filtro volta para a primeira página. */
  function filtrar(mudancas: Record<string, string | null>) {
    setPagina((p) => ({ ...p, pageIndex: 0 }))
    alterar(mudancas)
  }

  const tabela = useTable({
    features: recursos,
    columns: colunas,
    data: consulta.data?.data ?? SEM_LINHAS,
    rowCount: total,
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    state: { sorting: ordenacao, pagination: pagina },
    onSortingChange: setOrdenacao,
    onPaginationChange: setPagina,
  })
  const paginas = Math.max(1, Math.ceil(total / pagina.pageSize))

  return (
    <Pagina titulo="Respostas" descricao="Cada linha é uma avaliação enviada. Toque em uma linha para ver as perguntas, as notas e o comentário.">
      <Filtros {...estado} alterar={filtrar}>
        <Filtro rotulo="Classificação" id="f-classificacao">
          <select id="f-classificacao" name="classificacao" className={classeDaSelecao} value={classificacao ?? ''} onChange={(e) => filtrar({ classificacao: e.target.value })}>
            <option value="">Todas</option>
            <option value="NORMAL">Normal</option>
            <option value="BAIXA">Baixa</option>
            <option value="BAIXISSIMA">Baixíssima</option>
          </select>
        </Filtro>
        <Filtro rotulo="Comentário" id="f-comentario">
          <select id="f-comentario" name="comentario" className={classeDaSelecao} value={params.get('comentario') ?? ''} onChange={(e) => filtrar({ comentario: e.target.value })}>
            <option value="">Com ou sem comentário</option>
            <option value="sim">Só com comentário</option>
            <option value="nao">Só sem comentário</option>
          </select>
        </Filtro>
        <Filtro rotulo="Pedido de retorno" id="f-retorno">
          <select id="f-retorno" name="retorno" className={classeDaSelecao} value={params.get('retorno') ?? ''} onChange={(e) => filtrar({ retorno: e.target.value })}>
            <option value="">Com ou sem pedido</option>
            <option value="sim">Só quem pediu retorno</option>
            <option value="nao">Só quem não pediu</option>
          </select>
        </Filtro>
      </Filtros>

      <Bloco>
        <Consulta consulta={consulta} altura="h-96" vazio={(lista) => lista.data.length === 0} textoVazio="Nenhuma resposta com estes filtros. Tente um período maior ou tire algum filtro.">
          {() => (
            <>
              <p className="mb-3 text-sm text-muted-foreground" role="status">
                {numero(total)} {total === 1 ? 'resposta encontrada' : 'respostas encontradas'}
              </p>
              {/* em telas estreitas a tabela rola dentro do próprio bloco, nunca a página */}
              <Table>
                <TableHeader>
                  {tabela.getHeaderGroups().map((grupo) => (
                    <TableRow key={grupo.id}>
                      {grupo.headers.map((cabecalho) => {
                        const ordem = cabecalho.column.getIsSorted()
                        return (
                          <TableHead key={cabecalho.id} aria-sort={ordem === 'asc' ? 'ascending' : ordem === 'desc' ? 'descending' : undefined}>
                            {cabecalho.column.getCanSort() ? (
                              <button type="button" className="-mx-2 flex min-h-9 items-center gap-1 rounded-md px-2 font-medium hover:bg-muted" onClick={cabecalho.column.getToggleSortingHandler()}>
                                <tabela.FlexRender header={cabecalho} />
                                {ordem === 'asc' ? <ArrowUp aria-hidden className="size-3.5" /> : ordem === 'desc' ? <ArrowDown aria-hidden className="size-3.5" /> : <ArrowUpDown aria-hidden className="size-3.5 opacity-50" />}
                              </button>
                            ) : (
                              <tabela.FlexRender header={cabecalho} />
                            )}
                          </TableHead>
                        )
                      })}
                      <TableHead>
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {tabela.getRowModel().rows.map((linha) => (
                    <TableRow key={linha.id} className="cursor-pointer" onClick={() => alterar({ resposta: String(linha.original.id) })}>
                      {linha.getAllCells().map((celula) => (
                        <TableCell key={celula.id}>
                          <tabela.FlexRender cell={celula} />
                        </TableCell>
                      ))}
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={(e) => (e.stopPropagation(), alterar({ resposta: String(linha.original.id) }))}>
                          Ver<span className="sr-only"> resposta {linha.original.id}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="numeros text-sm text-muted-foreground">
                  Página {pagina.pageIndex + 1} de {paginas}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={pagina.pageIndex === 0} onClick={() => tabela.previousPage()}>
                    Anterior
                  </Button>
                  <Button variant="outline" disabled={pagina.pageIndex + 1 >= paginas} onClick={() => tabela.nextPage()}>
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </Consulta>
      </Bloco>

      <Detalhe id={aberta} aoFechar={() => alterar({ resposta: null })} />
    </Pagina>
  )
}
