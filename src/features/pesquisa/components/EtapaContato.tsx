import { useId, useRef, useState } from 'react'
import type { Complemento } from '@/lib/api/tipos'
import { mascararTelefone } from '@/lib/format'
import { BotaoDiscreto, BotaoPrincipal } from './botoes'
import { Aviso, Titulo } from './Moldura'

/**
 * Pedido de retorno: telefone opcional, com máscara brasileira e consentimento explícito,
 * nunca marcado de antemão, dizendo quem verá o número.
 */
export function EtapaContato({
  enviando,
  erro,
  aoEnviar,
  aoRecusar,
}: {
  enviando: boolean
  erro: string | null
  aoEnviar: (contato: NonNullable<Complemento['contato']>) => void
  aoRecusar: () => void
}) {
  const [telefone, setTelefone] = useState('')
  const [autorizou, setAutorizou] = useState(false)
  const [erros, setErros] = useState<{ telefone?: string; autorizacao?: string }>({})
  const campoTelefone = useRef<HTMLInputElement>(null)
  const campoAutorizacao = useRef<HTMLInputElement>(null)
  const id = useId()

  function enviar() {
    const digitos = telefone.replace(/\D/g, '')
    const novos = {
      telefone: /^\d{10,11}$/.test(digitos) ? undefined : 'Digite o telefone com o DDD, como (51) 99999-0000.',
      autorizacao: autorizou ? undefined : 'Marque a autorização para o hospital poder ligar.',
    }
    setErros(novos)
    // o foco vai para o primeiro campo com problema
    if (novos.telefone) return campoTelefone.current?.focus()
    if (novos.autorizacao) return campoAutorizacao.current?.focus()
    aoEnviar({ telefone: digitos, consentimento: true })
  }

  return (
    <>
      <Titulo>Quer que o hospital entre em contato com você?</Titulo>
      <p className="mt-2 text-muted-foreground">Se quiser, deixe um telefone. A Ouvidoria liga para conversar sobre o que aconteceu.</p>

      <label htmlFor={`${id}-telefone`} className="mt-6 block font-semibold">
        Telefone com DDD
      </label>
      <input
        ref={campoTelefone}
        id={`${id}-telefone`}
        type="tel"
        name="telefone"
        inputMode="numeric"
        autoComplete="tel-national"
        value={telefone}
        aria-invalid={erros.telefone ? true : undefined}
        aria-describedby={erros.telefone ? `${id}-erro-telefone` : undefined}
        onChange={(evento) => setTelefone(mascararTelefone(evento.target.value))}
        className="numeros mt-2 h-14 w-full rounded-2xl border-2 border-input bg-card px-4 text-2xl outline-none focus-visible:border-primary focus-visible:shadow-[0_0_0_3px_var(--secondary)] aria-invalid:border-destructive"
      />
      {erros.telefone && (
        <p id={`${id}-erro-telefone`} className="mt-2 font-medium text-destructive">
          {erros.telefone}
        </p>
      )}

      <label className="mt-5 flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-input bg-card p-4 has-checked:border-primary has-checked:bg-secondary">
        <input
          ref={campoAutorizacao}
          type="checkbox"
          name="autorizacao"
          checked={autorizou}
          aria-invalid={erros.autorizacao ? true : undefined}
          aria-describedby={erros.autorizacao ? `${id}-erro-autorizacao` : undefined}
          onChange={(evento) => setAutorizou(evento.target.checked)}
          className="mt-0.5 size-7 shrink-0 accent-primary"
        />
        <span>Autorizo o hospital a me ligar neste número para falar sobre esta avaliação. Só a Ouvidoria verá o telefone.</span>
      </label>
      {erros.autorizacao && (
        <p id={`${id}-erro-autorizacao`} className="mt-2 font-medium text-destructive">
          {erros.autorizacao}
        </p>
      )}

      {erro && <Aviso className="mt-4">{erro}</Aviso>}

      <BotaoPrincipal className="mt-5" disabled={enviando} onClick={enviar}>
        {enviando ? 'Enviando…' : 'Enviar telefone'}
      </BotaoPrincipal>
      <BotaoDiscreto className="mt-2 w-full" disabled={enviando} onClick={aoRecusar}>
        Não, obrigado
      </BotaoDiscreto>
    </>
  )
}
