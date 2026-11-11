import { useId, useState } from 'react'
import type { TipoComentario } from '@/lib/api/tipos'
import { ROTULO_COMENTARIO } from '@/lib/rotulos'
import { cn } from '@/lib/utils'
import type { Comentario } from '../fluxo'
import { BotaoDiscreto, BotaoPrincipal } from './botoes'
import { Aviso, Titulo } from './Moldura'

// Elogio vem primeiro e tem o mesmo tamanho dos outros: bom atendimento também merece registro.
const TIPOS: TipoComentario[] = ['ELOGIO', 'RECLAMACAO', 'SUGESTAO', 'OUTRO']

/**
 * Comentário opcional, depois que a avaliação já foi gravada. A pergunta muda conforme
 * a avaliação, mas a pessoa nunca vê termos internos como "nota baixa".
 */
export function EtapaComentario({
  avaliacaoBaixa,
  inicial,
  limite,
  enviando,
  erro,
  aoEnviar,
  aoPular,
}: {
  avaliacaoBaixa: boolean
  inicial: Comentario | null
  limite: number
  enviando: boolean
  erro: string | null
  aoEnviar: (comentario: Comentario) => void
  aoPular: () => void
}) {
  const [tipo, setTipo] = useState<TipoComentario>(inicial?.tipo ?? (avaliacaoBaixa ? 'RECLAMACAO' : 'ELOGIO'))
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const idTexto = useId()
  const idContador = useId()

  return (
    <>
      <Titulo>{avaliacaoBaixa ? 'Quer contar o que aconteceu?' : 'Quer deixar um elogio ou uma sugestão?'}</Titulo>
      <p className="mt-2 text-muted-foreground">Sua avaliação já foi enviada. Escrever é opcional.</p>

      <div role="group" aria-label="Tipo do comentário" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TIPOS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            aria-pressed={tipo === opcao}
            onClick={() => setTipo(opcao)}
            className={cn(
              'min-h-12 rounded-xl border-2 px-3 text-lg font-semibold transition-[background-color,border-color,transform] duration-150 active:scale-[0.97]',
              tipo === opcao ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-card hover:border-primary',
            )}
          >
            {ROTULO_COMENTARIO[opcao]}
          </button>
        ))}
      </div>

      <label htmlFor={idTexto} className="mt-5 block font-semibold">
        Seu comentário
      </label>
      <textarea
        id={idTexto}
        name="comentario"
        autoComplete="off"
        aria-describedby={idContador}
        value={texto}
        maxLength={limite}
        rows={4}
        onChange={(evento) => setTexto(evento.target.value)}
        className="mt-2 w-full rounded-2xl border-2 border-input bg-card px-4 py-3 text-xl outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--secondary)]"
      />
      <p id={idContador} className="numeros mt-1 text-right text-lg text-muted-foreground">
        {texto.length} de {limite} letras
      </p>

      {erro && <Aviso className="mt-3">{erro}</Aviso>}

      <BotaoPrincipal className="mt-4" disabled={!texto.trim() || enviando} onClick={() => aoEnviar({ tipo, texto: texto.trim() })}>
        {enviando ? 'Enviando…' : avaliacaoBaixa ? 'Continuar' : 'Enviar comentário'}
      </BotaoPrincipal>
      <BotaoDiscreto className="mt-2 w-full" disabled={enviando} onClick={aoPular}>
        Agora não
      </BotaoDiscreto>
    </>
  )
}
