import { useId, useState } from 'react'
import type { ItemEnvio, PerguntaPublica } from '@/lib/api/tipos'
import { useEscolha } from '../hooks/useEscolha'
import { BotaoPrincipal, Opcao } from './botoes'
import { EscalaRostinhos } from './EscalaRostinhos'

interface Props {
  pergunta: PerguntaPublica
  /** resposta já dada, quando a pessoa volta a esta pergunta */
  resposta?: ItemEnvio
  limiteTexto: number
  aoResponder: (item: ItemEnvio) => void
}

/** Uma pergunta do setor, no formato do seu tipo. Usada na pesquisa e na prévia do painel. */
export function Pergunta({ pergunta, resposta, limiteTexto, aoResponder }: Props) {
  const responder = (valor: Omit<ItemEnvio, 'perguntaId'>) => aoResponder({ perguntaId: pergunta.id, ...valor })

  if (pergunta.tipo === 'ESCALA_1_5') {
    return (
      <EscalaRostinhos
        pergunta={pergunta.texto}
        valor={resposta?.valorNumero}
        aoEscolher={(valorNumero) => responder({ valorNumero })}
      />
    )
  }
  if (pergunta.tipo === 'TEXTO') {
    return (
      <PerguntaTexto
        pergunta={pergunta.texto}
        inicial={resposta?.valorTexto}
        limite={limiteTexto}
        aoContinuar={(valorTexto) => responder({ valorTexto })}
      />
    )
  }
  const opcoes =
    pergunta.tipo === 'SIM_NAO'
      ? [
          { valor: 'SIM', rotulo: 'Sim' },
          { valor: 'NAO', rotulo: 'Não' },
        ]
      : (pergunta.opcoes ?? []).map((opcao) => ({ valor: opcao, rotulo: opcao }))
  return (
    <PerguntaOpcoes
      pergunta={pergunta.texto}
      opcoes={opcoes}
      valor={resposta?.valorTexto}
      aoEscolher={(valorTexto) => responder({ valorTexto })}
    />
  )
}

/** Sim/não e múltipla escolha: um toque responde e avança. */
function PerguntaOpcoes({
  pergunta,
  opcoes,
  valor,
  aoEscolher,
}: {
  pergunta: string
  opcoes: { valor: string; rotulo: string }[]
  valor?: string
  aoEscolher: (valor: string) => void
}) {
  const { recente, escolher } = useEscolha(aoEscolher)
  const marcado = recente ?? valor
  return (
    <div role="group" aria-label={pergunta} className="grid gap-3">
      {opcoes.map((opcao) => (
        <Opcao
          key={opcao.valor}
          selecionada={marcado === opcao.valor}
          apagada={recente !== null && recente !== opcao.valor}
          onClick={() => escolher(opcao.valor)}
        >
          {opcao.rotulo}
        </Opcao>
      ))}
    </div>
  )
}

/** Texto livre: opcional como as outras, com contador e botão para continuar. */
function PerguntaTexto({
  pergunta,
  inicial = '',
  limite,
  aoContinuar,
}: {
  pergunta: string
  inicial?: string
  limite: number
  aoContinuar: (texto: string) => void
}) {
  const [texto, setTexto] = useState(inicial)
  const idContador = useId()
  return (
    <div className="grid gap-3">
      <textarea
        name="resposta"
        autoComplete="off"
        aria-label={pergunta}
        aria-describedby={idContador}
        value={texto}
        maxLength={limite}
        rows={4}
        onChange={(evento) => setTexto(evento.target.value)}
        className="w-full rounded-2xl border-2 border-input bg-card px-4 py-3 text-xl outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--secondary)]"
      />
      <p id={idContador} className="numeros text-right text-lg text-muted-foreground">
        {texto.length} de {limite} letras
      </p>
      <BotaoPrincipal disabled={!texto.trim()} onClick={() => aoContinuar(texto.trim())}>
        Continuar
      </BotaoPrincipal>
    </div>
  )
}
