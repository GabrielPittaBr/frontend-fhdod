import type { PesquisaPublica } from '@/lib/api/tipos'
import { BotaoDiscreto, BotaoPrincipal } from '../components/botoes'
import { CarregaPesquisa } from '../components/CarregaPesquisa'
import { Etapas } from '../components/Etapas'
import { useFluxoPesquisa } from '../hooks/useFluxoPesquisa'
import { useContagem, useInatividade, useModoTotem } from '../hooks/useModoTotem'

const SEGUNDOS_DO_AVISO = 10

/** /totem/:setor: a mesma pesquisa, no aparelho fixo do setor. */
export default function TotemPage() {
  useModoTotem()
  return (
    <CarregaPesquisa totem>
      {(pesquisa, atualizar, versao) => (
        // a cada reinício a definição é buscada de novo; se as perguntas mudaram, a pesquisa recomeça com elas
        <Totem key={versao} pesquisa={pesquisa} aoReiniciar={atualizar} />
      )}
    </CarregaPesquisa>
  )
}

function Totem({ pesquisa, aoReiniciar }: { pesquisa: PesquisaPublica; aoReiniciar: () => void }) {
  const fluxo = useFluxoPesquisa(pesquisa, 'TOTEM')
  const emAndamento = fluxo.estado.etapa !== 'abertura' && fluxo.estado.etapa !== 'agradecimento'
  const inatividade = useInatividade(emAndamento, pesquisa.totem.inatividadeSegundos)

  // Reiniciar apaga todo o estado: o próximo paciente não vê nada do anterior.
  function reiniciar() {
    inatividade.continuar()
    fluxo.reiniciar()
    aoReiniciar()
  }

  return (
    <>
      <Etapas
        pesquisa={pesquisa}
        fluxo={fluxo}
        reinicio={{ segundos: pesquisa.totem.reinicioSegundos, aoReiniciar: reiniciar }}
      />
      {inatividade.avisando && <AindaEstaAi aoContinuar={inatividade.continuar} aoReiniciar={reiniciar} />}
    </>
  )
}

function AindaEstaAi({ aoContinuar, aoReiniciar }: { aoContinuar: () => void; aoReiniciar: () => void }) {
  const restam = useContagem(SEGUNDOS_DO_AVISO, aoReiniciar)
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="ainda-esta-ai"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/70 p-6 text-lg"
    >
      <div className="w-full max-w-md rounded-3xl bg-card p-8">
        <h2 id="ainda-esta-ai" className="text-[2rem]/[1.15] font-bold">
          Ainda está aí?
        </h2>
        {/* anunciado uma vez ao leitor de tela; o número que muda fica só visível */}
        <p className="sr-only" role="status">
          Sem resposta, a avaliação recomeça em {SEGUNDOS_DO_AVISO} segundos.
        </p>
        <p aria-hidden className="numeros mt-3">
          Sem resposta, a avaliação recomeça em {restam}&nbsp;s.
        </p>
        <BotaoPrincipal autoFocus className="mt-6" onClick={aoContinuar}>
          Sim, continuar
        </BotaoPrincipal>
        <BotaoDiscreto className="mt-2 w-full" onClick={aoReiniciar}>
          Começar do início
        </BotaoDiscreto>
      </div>
    </div>
  )
}
