import { useMutation } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Pagina } from '@/components/layout/Pagina'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { mensagemDeErro } from '@/lib/api/erro'
import type { FiltrosDashboard } from '@/lib/api/tipos'
import { dataCurta } from '@/lib/format'
import { usePode } from '@/stores/sessao'
import { exportarRespostas, exportarResumo } from '../api'
import { Categorias, Comentarios, Evolucao, Indicadores, NpsPorSetor, Ranking } from '../components/blocos'
import { Filtros } from '../components/Filtros'
import { useFiltros } from '../filtros'

function baixar({ nomeArquivo, conteudo }: { nomeArquivo: string; conteudo: string }) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo })
  link.click()
  URL.revokeObjectURL(url)
}

/** A exportação usa os mesmos filtros da tela e só traz o que o usuário pode ver. */
function Exportar({ filtros }: { filtros: FiltrosDashboard }) {
  const podeDetalhar = usePode('exportacao:detalhada')
  const exportacao = useMutation({
    mutationFn: (detalhada: boolean) => (detalhada ? exportarRespostas(filtros) : exportarResumo(filtros)),
    onSuccess: (arquivo) => {
      baixar(arquivo)
      toast.success('Arquivo exportado', { description: 'Abra no Excel. Ele traz os mesmos filtros da tela.' })
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, 'Não deu para exportar agora.')),
  })
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exportacao.isPending}>
          <Download aria-hidden />
          {exportacao.isPending ? 'Exportando…' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuItem className="min-h-10" onSelect={() => exportacao.mutate(false)}>
          Resumo dos indicadores (Excel)
        </DropdownMenuItem>
        {podeDetalhar && (
          <DropdownMenuItem className="min-h-10" onSelect={() => exportacao.mutate(true)}>
            Todas as respostas (Excel)
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="min-h-10" disabled>
          PDF: chega junto com a API
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** /painel: visão geral em segundos, do hospital até o setor e o turno. */
export default function DashboardPage() {
  const estado = useFiltros()
  const { filtros, alterar } = estado
  const veComentarios = usePode('comentarios:ver')

  return (
    <Pagina
      titulo="Indicadores de satisfação"
      descricao={`De ${dataCurta(filtros.inicio)} a ${dataCurta(filtros.fim)}, pelo ${filtros.base === 'ENVIO' ? 'dia em que a resposta foi enviada' : 'dia do atendimento'}.`}
      acoes={<Exportar filtros={filtros} />}
    >
      <Filtros {...estado} />
      <Indicadores filtros={filtros} />
      <div className="grid gap-5 xl:grid-cols-2">
        <NpsPorSetor filtros={filtros} aoEscolher={(setorId) => alterar({ setor: setorId ? String(setorId) : null })} />
        <Evolucao filtros={filtros} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Categorias filtros={filtros} />
        <Ranking filtros={filtros} />
      </div>
      {veComentarios && <Comentarios filtros={filtros} />}
    </Pagina>
  )
}
