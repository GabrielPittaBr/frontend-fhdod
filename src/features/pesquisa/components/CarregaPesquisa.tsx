import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { Carregando, TelaMensagem } from '@/components/TelaMensagem'
import { ErroApi } from '@/lib/api/erro'
import type { PesquisaPublica } from '@/lib/api/tipos'
import { buscarPesquisa } from '../api'
import { BotaoPrincipal } from './botoes'

/**
 * Busca a pesquisa do setor que vem na URL (do QR Code ou do link) e cuida de carregar e de falhar.
 * Setor inexistente ou inativo mostra uma mensagem amigável, nunca um erro técnico.
 */
export function CarregaPesquisa({
  totem = false,
  children,
}: {
  totem?: boolean
  children: (pesquisa: PesquisaPublica, atualizar: () => void, versao: number) => ReactNode
}) {
  const { setor = '' } = useParams()
  const consulta = useQuery({
    queryKey: ['pesquisa', setor],
    queryFn: () => buscarPesquisa(setor),
    staleTime: Infinity,
    // o totem fica ligado o dia todo: se a rede cair na abertura, tenta de novo sozinho
    refetchInterval: (q) => (totem && q.state.status === 'error' ? 30_000 : false),
  })

  if (consulta.isPending) return <Carregando texto="Abrindo a pesquisa…" />

  if (consulta.isError) {
    const indisponivel = consulta.error instanceof ErroApi && consulta.error.status === 404
    return indisponivel ? (
      <TelaMensagem titulo="Esta pesquisa não está disponível">
        <p>O endereço pode estar incompleto ou a pesquisa deste setor está pausada.</p>
        <p className="mt-2">Aponte a câmera de novo para o QR Code ou peça ajuda na recepção.</p>
      </TelaMensagem>
    ) : (
      <TelaMensagem
        titulo="Não deu para abrir a pesquisa"
        acao={<BotaoPrincipal onClick={() => consulta.refetch()}>Tentar de novo</BotaoPrincipal>}
      >
        <p>Confira a internet do aparelho e tente de novo.</p>
      </TelaMensagem>
    )
  }

  return (
    <>
      <title>{`Avaliação do atendimento: ${consulta.data.setor.nome} | FHDOD`}</title>
      {children(consulta.data, () => void consulta.refetch(), consulta.dataUpdatedAt)}
    </>
  )
}
