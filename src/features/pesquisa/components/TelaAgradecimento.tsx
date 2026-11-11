import { CircleCheck } from 'lucide-react'
import { useContagem } from '../hooks/useModoTotem'
import { BotaoPrincipal } from './botoes'
import { Titulo } from './Moldura'

/** Fim da pesquisa: deixa claro que a avaliação foi enviada. No totem, reinicia sozinha. */
export function TelaAgradecimento({ reinicio }: { reinicio?: { segundos: number; aoReiniciar: () => void } }) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <CircleCheck aria-hidden className="size-20 text-primary" strokeWidth={1.75} />
      <Titulo className="mt-5">Avaliação enviada</Titulo>
      <p className="mt-3 text-xl">Obrigado. Sua opinião ajuda o hospital a cuidar melhor de quem chega.</p>
      {reinicio ? (
        <ReinicioAutomatico {...reinicio} />
      ) : (
        <p className="mt-6 text-muted-foreground">Você já pode fechar esta página.</p>
      )}
    </div>
  )
}

function ReinicioAutomatico({ segundos, aoReiniciar }: { segundos: number; aoReiniciar: () => void }) {
  const restam = useContagem(segundos, aoReiniciar)
  return (
    <div className="mt-8">
      {/* anunciado uma vez ao leitor de tela; o número que muda a cada segundo fica só visível */}
      <p className="sr-only" role="status">
        Uma nova avaliação começa em {segundos} segundos.
      </p>
      <p aria-hidden className="numeros text-muted-foreground">
        Uma nova avaliação começa em {restam}&nbsp;s.
      </p>
      <BotaoPrincipal className="mt-4" onClick={aoReiniciar}>
        Começar nova avaliação
      </BotaoPrincipal>
    </div>
  )
}
