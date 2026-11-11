import { subDays } from 'date-fns'
import { useId, useState } from 'react'
import type { PesquisaPublica } from '@/lib/api/tipos'
import { dataPorExtenso, horaFalada, isoDoDia } from '@/lib/format'
import { useEscolha } from '../hooks/useEscolha'
import { BotaoPrincipal, Opcao } from './botoes'
import { Titulo } from './Moldura'

/**
 * Dia do atendimento, que nem sempre é o dia da resposta: muita gente responde em casa, à noite.
 * Data futura não é aceita.
 */
export function EtapaData({ valor, aoEscolher }: { valor: string | null; aoEscolher: (data: string) => void }) {
  const agora = new Date()
  const hoje = isoDoDia(agora)
  const ontem = isoDoDia(subDays(agora, 1))
  const outroDiaJaEscolhido = valor !== null && valor !== hoje && valor !== ontem

  const { recente, escolher } = useEscolha(aoEscolher)
  const [outroDia, setOutroDia] = useState(outroDiaJaEscolhido)
  const [data, setData] = useState(outroDiaJaEscolhido ? valor : '')
  const idData = useId()
  const marcado = recente ?? (outroDia ? null : valor)
  const dataValida = /^\d{4}-\d{2}-\d{2}$/.test(data) && data <= hoje

  return (
    <>
      <Titulo>Quando foi o atendimento?</Titulo>
      <div role="group" aria-label="Dia do atendimento" className="mt-6 grid gap-3">
        <Opcao
          selecionada={marcado === hoje}
          apagada={recente !== null && recente !== hoje}
          detalhe={dataPorExtenso(agora)}
          onClick={() => escolher(hoje)}
        >
          Hoje
        </Opcao>
        <Opcao
          selecionada={marcado === ontem}
          apagada={recente !== null && recente !== ontem}
          detalhe={dataPorExtenso(subDays(agora, 1))}
          onClick={() => escolher(ontem)}
        >
          Ontem
        </Opcao>
        <Opcao selecionada={outroDia} apagada={recente !== null} aria-expanded={outroDia} onClick={() => setOutroDia(true)}>
          Outro dia
        </Opcao>
      </div>

      {outroDia && (
        <div className="mt-5 grid gap-3">
          <label htmlFor={idData} className="font-semibold">
            Escolha o dia do atendimento
          </label>
          <input
            id={idData}
            type="date"
            name="dataAtendimento"
            max={hoje}
            value={data}
            autoFocus
            onChange={(evento) => setData(evento.target.value)}
            className="h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-xl outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--secondary)]"
          />
          <BotaoPrincipal disabled={!dataValida} onClick={() => aoEscolher(data)}>
            Continuar
          </BotaoPrincipal>
        </div>
      )}
    </>
  )
}

/** Turno do atendimento, com os horários que vêm da API. */
export function EtapaTurno({
  turnos,
  valor,
  aoEscolher,
}: {
  turnos: PesquisaPublica['turnos']
  valor: number | null
  aoEscolher: (turnoId: number) => void
}) {
  const { recente, escolher } = useEscolha(aoEscolher)
  const marcado = recente ?? valor
  return (
    <>
      <Titulo>Em que período você foi atendido?</Titulo>
      <div role="group" aria-label="Período do atendimento" className="mt-6 grid gap-3">
        {turnos.map((turno) => (
          <Opcao
            key={turno.id}
            selecionada={marcado === turno.id}
            apagada={recente !== null && recente !== turno.id}
            detalhe={`das ${horaFalada(turno.horaInicio)} às ${horaFalada(turno.horaFim)}`}
            onClick={() => escolher(turno.id)}
          >
            {turno.nome}
          </Opcao>
        ))}
      </div>
    </>
  )
}
