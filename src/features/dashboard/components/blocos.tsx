// Blocos do dashboard. Cada um cuida dos seus estados: carregando, vazio e erro.
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays, parseISO } from 'date-fns'
import { Info } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Barra } from '@/components/charts/Barra'
import { GraficoEvolucao } from '@/components/charts/GraficoEvolucao'
import { Bloco, Consulta } from '@/components/layout/Pagina'
import { SeloClassificacao, SeloComentario } from '@/components/Selos'
import type { FiltrosDashboard, Granularidade, ItemRanking, Resumo, TipoComentario } from '@/lib/api/tipos'
import { nivelDaMedia } from '@/lib/escala'
import { dataCurta, decimal, npsComSinal, numero, rotuloDoPeriodo } from '@/lib/format'
import { ROTULO_COMENTARIO } from '@/lib/rotulos'
import { cn } from '@/lib/utils'
import { buscarCategorias, buscarComentarios, buscarEvolucao, buscarNpsPorSetor, buscarRanking, buscarResumo } from '../api'

// Indicadores de satisfação não mudam a cada segundo: recarrega a cada 60 s
// (e ao voltar para a aba); ao trocar o filtro, mantém os números anteriores esmaecidos em vez de piscar.
const leitura = { refetchInterval: 60_000, refetchOnWindowFocus: true, placeholderData: keepPreviousData } as const
/** Abaixo disso a nota oscila demais para tirar conclusão. Regra de exibição, a confirmar com o hospital. */
const AMOSTRA_PEQUENA = 30

const respostas = (total: number) => `${numero(total)} ${total === 1 ? 'resposta' : 'respostas'}`
const percentual = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)

function Chips<T extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string
  opcoes: readonly (readonly [T, string])[]
  valor: T
  aoMudar: (valor: T) => void
}) {
  return (
    <div role="group" aria-label={rotulo} className="flex flex-wrap gap-1">
      {opcoes.map(([opcao, texto]) => (
        <button
          key={opcao}
          type="button"
          aria-pressed={valor === opcao}
          onClick={() => aoMudar(opcao)}
          className={cn(
            'min-h-9 rounded-md border px-2.5 text-sm transition-colors',
            valor === opcao ? 'border-primary bg-primary font-medium text-primary-foreground' : 'border-input/60 bg-card hover:bg-muted',
          )}
        >
          {texto}
        </button>
      ))}
    </div>
  )
}

// ---------- Indicadores ----------

// Par divergente (quente e frio) com cinza no meio; conferido para daltonismo com o validador da skill dataviz.
const PARTES = [
  { chave: 'detratores', rotulo: 'Detratores', notas: 'notas de 0 a 6', cor: '#c73e32', texto: '#fff' },
  { chave: 'neutros', rotulo: 'Neutros', notas: 'notas 7 e 8', cor: '#9fb0b5', texto: 'var(--foreground)' },
  { chave: 'promotores', rotulo: 'Promotores', notas: 'notas 9 e 10', cor: 'var(--primary)', texto: '#fff' },
] as const

function Composicao({ resumo }: { resumo: Resumo }) {
  return (
    <div>
      <div
        role="img"
        aria-label={PARTES.map((p) => `${p.rotulo}: ${percentual(resumo[p.chave], resumo.total)}%`).join(', ')}
        className="flex h-7 gap-0.5"
      >
        {PARTES.map((parte) => {
          const fatia = percentual(resumo[parte.chave], resumo.total)
          if (fatia === 0) return null
          return (
            <span
              key={parte.chave}
              className="flex items-center rounded px-2 text-sm font-semibold"
              style={{ width: `${fatia}%`, backgroundColor: parte.cor, color: parte.texto }}
            >
              {fatia >= 9 && `${fatia}%`}
            </span>
          )
        })}
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-3">
        {PARTES.map((parte) => (
          <div key={parte.chave} className="flex items-baseline gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: parte.cor }} />
            <dt className="text-sm">
              {parte.rotulo} <span className="text-muted-foreground">({parte.notas})</span>
            </dt>
            <dd className="numeros ml-auto font-semibold sm:ml-0">{numero(resumo[parte.chave])}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function Indicadores({ filtros }: { filtros: FiltrosDashboard }) {
  const consulta = useQuery({ queryKey: ['dashboard', 'resumo', filtros], queryFn: () => buscarResumo(filtros), ...leitura })
  return (
    <Bloco>
      <Consulta consulta={consulta} altura="h-52">
        {(resumo) => {
          if (resumo.total === 0) {
            return <p className="py-8 text-center text-muted-foreground">Nenhuma resposta com estes filtros. Tente um período maior.</p>
          }
          const nivel = resumo.mediaEscala === null ? null : nivelDaMedia(resumo.mediaEscala)
          return (
            <>
              <div className="grid gap-6 lg:grid-cols-[minmax(15rem,auto)_1fr] lg:items-center">
                <div>
                  <h2 className="text-sm font-semibold">NPS do período</h2>
                  {/* a nota aparece sempre ao lado do tamanho da amostra */}
                  <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
                    <span className="text-6xl font-bold tracking-tight">{npsComSinal(resumo.nps ?? 0)}</span>
                    <span className="text-lg text-muted-foreground">em {respostas(resumo.total)}</span>
                  </p>
                  {resumo.total < AMOSTRA_PEQUENA && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-md border border-aviso-borda bg-aviso-fundo px-2.5 py-1.5 text-sm text-aviso">
                      <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                      Poucas respostas: com menos de {AMOSTRA_PEQUENA}, a nota muda muito a cada avaliação.
                    </p>
                  )}
                </div>
                <div>
                  <Composicao resumo={resumo} />
                  <p className="mt-3 text-sm text-muted-foreground">
                    O NPS é o percentual de promotores menos o de detratores. Vai de −100 a +100.
                  </p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 lg:grid-cols-4">
                <div>
                  <dt className="text-sm text-muted-foreground">Respostas</dt>
                  <dd className="text-2xl font-semibold">{numero(resumo.total)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Avaliações com nota baixa</dt>
                  <dd className="text-2xl font-semibold">
                    {numero(resumo.notasBaixas)}{' '}
                    <span className="text-sm font-normal text-muted-foreground">{percentual(resumo.notasBaixas, resumo.total)}% do total</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Dessas, baixíssimas</dt>
                  <dd className="text-2xl font-semibold">{numero(resumo.baixissimas)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Média das notas de 1 a 5</dt>
                  <dd className="flex items-center gap-2 text-2xl font-semibold">
                    {nivel && resumo.mediaEscala !== null ? (
                      <>
                        <img src={nivel.imagem} alt="" width={28} height={28} className="size-7" />
                        {decimal(resumo.mediaEscala)}
                        <span className="text-sm font-normal text-muted-foreground">{nivel.rotulo}</span>
                      </>
                    ) : (
                      <span className="text-sm font-normal text-muted-foreground">Sem notas no período</span>
                    )}
                  </dd>
                </div>
              </dl>
            </>
          )
        }}
      </Consulta>
    </Bloco>
  )
}

// ---------- NPS por setor ----------

export function NpsPorSetor({ filtros, aoEscolher }: { filtros: FiltrosDashboard; aoEscolher: (setorId: number | null) => void }) {
  const consulta = useQuery({ queryKey: ['dashboard', 'setores', filtros], queryFn: () => buscarNpsPorSetor(filtros), ...leitura })
  return (
    <Bloco
      titulo="NPS por setor"
      descricao={filtros.setorId ? undefined : 'Toque em um setor para ver só os números dele.'}
      lateral={
        filtros.setorId && (
          <button type="button" className="min-h-9 text-sm font-semibold text-primary underline underline-offset-4" onClick={() => aoEscolher(null)}>
            Ver todos os setores
          </button>
        )
      }
    >
      <Consulta consulta={consulta} vazio={(dados) => dados.length === 0} textoVazio="Nenhum setor recebeu respostas neste período.">
        {(setores) => {
          const minimo = setores.some((s) => (s.nps ?? 0) < 0) ? -100 : 0
          return (
            <ul className="grid gap-1">
              {setores.map((s) => (
                <li key={s.setorId}>
                  <button
                    type="button"
                    disabled={filtros.setorId === s.setorId}
                    onClick={() => aoEscolher(s.setorId)}
                    className="grid min-h-12 w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-md px-2 py-1.5 text-left transition-colors enabled:hover:bg-muted sm:grid-cols-[11rem_1fr_9.5rem]"
                  >
                    <span className="font-medium">{s.setor}</span>
                    <span className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
                      <Barra valor={s.nps ?? 0} minimo={minimo} />
                    </span>
                    <span className="numeros text-right">
                      <strong className="text-base">{s.nps === null ? '–' : npsComSinal(s.nps)}</strong>{' '}
                      <span className="text-sm text-muted-foreground">em {respostas(s.total)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        }}
      </Consulta>
    </Bloco>
  )
}

// ---------- Evolução ----------

const GRANULARIDADES = [
  ['DIA', 'Por dia'],
  ['SEMANA', 'Por semana'],
  ['MES', 'Por mês'],
] as const

export function Evolucao({ filtros }: { filtros: FiltrosDashboard }) {
  const dias = differenceInCalendarDays(parseISO(filtros.fim), parseISO(filtros.inicio)) + 1
  const sugerida: Granularidade = dias <= 14 ? 'DIA' : dias <= 120 ? 'SEMANA' : 'MES'
  const [escolhida, setEscolhida] = useState<Granularidade | null>(null)
  const granularidade = escolhida ?? sugerida
  const consulta = useQuery({
    queryKey: ['dashboard', 'evolucao', filtros, granularidade],
    queryFn: () => buscarEvolucao(filtros, granularidade),
    ...leitura,
  })
  return (
    <Bloco
      titulo="Evolução do NPS"
      descricao="A linha mostra a nota; as colunas, quantas respostas cada período teve."
      lateral={<Chips rotulo="Agrupar a evolução" opcoes={GRANULARIDADES} valor={granularidade} aoMudar={setEscolhida} />}
    >
      <Consulta consulta={consulta} altura="h-72" vazio={(dados) => dados.every((p) => p.total === 0)} textoVazio="Nenhuma resposta neste período.">
        {(pontos) => (
          <>
            <GraficoEvolucao dados={pontos} granularidade={granularidade} />
            <details className="mt-3 text-sm">
              <summary className="min-h-9 w-fit font-semibold text-primary underline underline-offset-4">Ver os números em tabela</summary>
              <div className="mt-2 max-h-64 overflow-auto">
                <table className="numeros w-full max-w-md text-left">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="py-1 pr-4 font-medium">Período</th>
                      <th className="py-1 pr-4 font-medium">NPS</th>
                      <th className="py-1 font-medium">Respostas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pontos.map((p) => (
                      <tr key={p.periodo} className="border-t">
                        <td className="py-1 pr-4">{rotuloDoPeriodo(p.periodo, granularidade, true)}</td>
                        <td className="py-1 pr-4">{p.nps === null ? '–' : npsComSinal(p.nps)}</td>
                        <td className="py-1">{numero(p.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </Consulta>
    </Bloco>
  )
}

// ---------- Categorias e ranking ----------

function Media({ media }: { media: number }) {
  const nivel = nivelDaMedia(media)
  return (
    <span className="flex items-center gap-1.5">
      <img src={nivel.imagem} alt={nivel.rotulo} width={24} height={24} className="size-6" />
      <strong className="numeros">{decimal(media)}</strong>
    </span>
  )
}

export function Categorias({ filtros }: { filtros: FiltrosDashboard }) {
  const consulta = useQuery({ queryKey: ['dashboard', 'categorias', filtros], queryFn: () => buscarCategorias(filtros), ...leitura })
  return (
    <Bloco titulo="Notas por categoria" descricao="Média de 1 a 5 e quanto das notas foi 4 (Bom) ou 5 (Muito bom).">
      <Consulta consulta={consulta} vazio={(dados) => dados.length === 0} textoVazio="Nenhuma nota de 1 a 5 neste período.">
        {(categorias) => (
          <ul className="grid gap-3">
            {categorias.map((c) => (
              <li key={c.categoriaId} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[10rem_4.5rem_1fr_auto]">
                <span className="font-medium">{c.categoria}</span>
                <Media media={c.media ?? 0} />
                <span className="col-span-2 sm:col-span-1">
                  <Barra valor={c.percentual45 ?? 0} />
                </span>
                <span className="numeros col-span-2 text-sm text-muted-foreground sm:col-span-1 sm:text-right">
                  <strong className="text-foreground">{c.percentual45}%</strong> de {numero(c.total)} notas
                </span>
              </li>
            ))}
          </ul>
        )}
      </Consulta>
    </Bloco>
  )
}

function ListaDePontos({ titulo, pontos, vazio }: { titulo: string; pontos: ItemRanking[]; vazio: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{titulo}</h3>
      {pontos.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{vazio}</p>
      ) : (
        <ol className="mt-2 grid gap-2">
          {pontos.map((p) => (
            <li key={`${p.setorId}-${p.categoriaId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2">
              <Media media={p.media} />
              <span className="min-w-0 flex-1 basis-40">
                <span className="block font-medium">{p.categoria}</span>
                <span className="block text-sm text-muted-foreground">{p.setor}</span>
              </span>
              <span className="numeros shrink-0 text-right text-sm whitespace-nowrap text-muted-foreground">
                {p.percentual45}% de notas 4 e 5
                <br />
                {numero(p.total)} notas
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function Ranking({ filtros }: { filtros: FiltrosDashboard }) {
  const consulta = useQuery({ queryKey: ['dashboard', 'ranking', filtros], queryFn: () => buscarRanking(filtros), ...leitura })
  return (
    <Bloco titulo="Melhores e piores pontos" descricao="Cada ponto é uma categoria dentro de um setor. Só entram pontos com 5 notas ou mais.">
      <Consulta consulta={consulta} vazio={(r) => r.melhores.length === 0} textoVazio="Ainda não há notas suficientes para comparar.">
        {(ranking) => (
          <div className="grid gap-6">
            <ListaDePontos titulo="Onde está melhor" pontos={ranking.melhores} vazio="" />
            <ListaDePontos titulo="Onde precisa de atenção" pontos={ranking.piores} vazio="Há poucos pontos avaliados para separar os piores." />
          </div>
        )}
      </Consulta>
    </Bloco>
  )
}

// ---------- Comentários ----------

const TIPOS = [
  ['TODOS', 'Todos'],
  ['ELOGIO', `${ROTULO_COMENTARIO.ELOGIO}s`],
  ['RECLAMACAO', 'Reclamações'],
  ['SUGESTAO', 'Sugestões'],
  ['OUTRO', 'Outros'],
] as const

export function Comentarios({ filtros }: { filtros: FiltrosDashboard }) {
  const [tipo, setTipo] = useState<TipoComentario | 'TODOS'>('TODOS')
  const consulta = useQuery({
    queryKey: ['dashboard', 'comentarios', filtros, tipo],
    queryFn: () => buscarComentarios(filtros, tipo === 'TODOS' ? undefined : tipo),
    ...leitura,
  })
  return (
    <Bloco
      titulo="Comentários recentes"
      descricao={consulta.data ? `${numero(consulta.data.meta.total)} no período. Estes são os mais novos.` : undefined}
      lateral={<Chips rotulo="Tipo de comentário" opcoes={TIPOS} valor={tipo} aoMudar={setTipo} />}
    >
      <Consulta consulta={consulta} vazio={(lista) => lista.data.length === 0} textoVazio="Nenhum comentário deste tipo no período.">
        {(lista) => (
          <ul className="grid gap-3 md:grid-cols-2">
            {lista.data.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <SeloComentario tipo={c.tipo} />
                  {c.classificacao !== 'NORMAL' && <SeloClassificacao valor={c.classificacao} />}
                </div>
                <p className="flex-1">{c.texto}</p>
                <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <span>
                    {c.setor}, atendimento em {dataCurta(c.dataAtendimento)}
                  </span>
                  <Link to={`/painel/respostas?resposta=${c.respostaId}`} className="font-semibold text-primary underline underline-offset-4">
                    Ver a resposta
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        )}
      </Consulta>
    </Bloco>
  )
}
