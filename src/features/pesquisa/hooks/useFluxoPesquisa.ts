import { useMutation } from '@tanstack/react-query'
import { useEffect, useReducer, useRef } from 'react'
import type { Canal, Complemento, EnvioResposta, ItemEnvio, PesquisaPublica, RespostaCriada } from '@/lib/api/tipos'
import { isoDoDia } from '@/lib/format'
import { enviarComplemento, enviarResposta } from '../api'
import { estadoInicial, montarEnvio, novaChave, progresso, redutor, turnoDoHorario, type Comentario } from '../fluxo'

/** Etapas, respostas e envio da pesquisa. O mesmo hook atende celular, computador e totem. */
export function useFluxoPesquisa(pesquisa: PesquisaPublica, canal: Canal) {
  const slug = pesquisa.setor.slug
  const [estado, despachar] = useReducer(redutor, pesquisa, (p) =>
    estadoInicial(p.perguntas.map((pergunta) => pergunta.id), novaChave()),
  )
  // trava contra duplo toque no "Enviar"; a chave de idempotência cobre o que escapar
  const enviando = useRef(false)

  const envio = useMutation({
    mutationFn: (corpo: EnvioResposta) => enviarResposta(slug, corpo),
    onSuccess: (criada) => despachar({ tipo: 'ENVIADA', criada }),
    onSettled: () => {
      enviando.current = false
    },
  })

  const complemento = useMutation({
    mutationFn: (v: { criada: RespostaCriada; corpo: Complemento }) =>
      enviarComplemento(v.criada.id, v.criada.tokenComplemento, v.corpo),
    onSuccess: () => despachar({ tipo: 'CONCLUIR' }),
  })

  // Comentário confirmado na tela anterior, ainda não enviado porque a pessoa está na tela do telefone.
  const pendente =
    estado.etapa === 'contato' && estado.criada && estado.comentario
      ? { criada: estado.criada, comentario: estado.comentario }
      : null

  function enviarPendente() {
    if (!pendente) return
    // se a pessoa for embora sem decidir sobre o telefone, o comentário não se perde
    void enviarComplemento(pendente.criada.id, pendente.criada.tokenComplemento, {
      comentario: pendente.comentario,
    }).catch(() => undefined)
  }

  useEffect(() => {
    if (!pendente) return
    window.addEventListener('pagehide', enviarPendente)
    return () => window.removeEventListener('pagehide', enviarPendente)
  })

  return {
    estado,
    progresso: progresso(estado),
    perguntaAtual: estado.etapa === 'pergunta' ? pesquisa.perguntas[estado.indice] : undefined,

    comecar: () =>
      despachar({
        tipo: 'COMECAR',
        // totem: vale a data de hoje e o turno do horário atual
        atendimento:
          canal === 'TOTEM'
            ? { dataAtendimento: isoDoDia(), turnoId: turnoDoHorario(pesquisa.turnos, new Date()) }
            : undefined,
      }),
    definirData: (dataAtendimento: string) => despachar({ tipo: 'DEFINIR_DATA', dataAtendimento }),
    definirTurno: (turnoId: number) => despachar({ tipo: 'DEFINIR_TURNO', turnoId }),
    responder: (item: ItemEnvio) => despachar({ tipo: 'RESPONDER', item }),
    pular: () => despachar({ tipo: 'PULAR' }),
    voltar: () => despachar({ tipo: 'VOLTAR' }),
    selecionarNps: (nps: number) => despachar({ tipo: 'SELECIONAR_NPS', nps }),

    /** Grava a avaliação. Se falhar, nada do que foi respondido se perde e a chave é a mesma na nova tentativa. */
    enviar() {
      const corpo = montarEnvio(estado, canal)
      if (!corpo || enviando.current) return
      enviando.current = true
      envio.mutate(corpo)
    },
    envio: { pendente: envio.isPending, erro: envio.error },

    /** Tela do comentário: null quando a pessoa escolhe "Agora não". */
    comentar(comentario: Comentario | null) {
      if (!estado.criada) return
      if (estado.criada.classificacao !== 'NORMAL') return despachar({ tipo: 'COMENTAR', comentario })
      if (!comentario) return despachar({ tipo: 'CONCLUIR' })
      complemento.mutate({ criada: estado.criada, corpo: { comentario } })
    },
    /** Tela do telefone: envia de uma vez o comentário guardado e, se houver, o contato. */
    concluir(contato?: Complemento['contato']) {
      if (!estado.criada) return
      const corpo: Complemento = {}
      if (estado.comentario) corpo.comentario = estado.comentario
      if (contato) corpo.contato = contato
      if (!corpo.comentario && !corpo.contato) return despachar({ tipo: 'CONCLUIR' })
      complemento.mutate({ criada: estado.criada, corpo })
    },
    /** A avaliação já está salva: dá para terminar mesmo se o complemento falhar. */
    terminarSemComplemento: () => despachar({ tipo: 'CONCLUIR' }),
    complemento: { pendente: complemento.isPending, erro: complemento.error },

    /** Volta ao início apagando tudo (totem). */
    reiniciar() {
      enviarPendente()
      envio.reset()
      complemento.reset()
      despachar({ tipo: 'REINICIAR', chaveIdempotencia: novaChave() })
    },
  }
}

export type FluxoPesquisa = ReturnType<typeof useFluxoPesquisa>
