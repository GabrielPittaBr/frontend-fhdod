import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ErroApi, mensagemDeErro } from '@/lib/api/erro'
import type { PesquisaPublica } from '@/lib/api/tipos'
import { NIVEIS } from '@/lib/escala'
import type { FluxoPesquisa } from '../hooks/useFluxoPesquisa'
import { BotaoDiscreto, BotaoPrincipal } from './botoes'
import { EscalaNps } from './EscalaNps'
import { EtapaComentario } from './EtapaComentario'
import { EtapaContato } from './EtapaContato'
import { EtapaData, EtapaTurno } from './EtapaDataTurno'
import { Aviso, Moldura, Titulo } from './Moldura'
import { Pergunta } from './Pergunta'
import { TelaAgradecimento } from './TelaAgradecimento'

/** Desenha a etapa atual da pesquisa. É a mesma sequência no celular, no computador e no totem. */
export function Etapas({
  pesquisa,
  fluxo,
  reinicio,
}: {
  pesquisa: PesquisaPublica
  fluxo: FluxoPesquisa
  /** só no totem: contagem para a próxima avaliação */
  reinicio?: { segundos: number; aoReiniciar: () => void }
}) {
  const { estado } = fluxo
  const conteudo = useRef<HTMLDivElement>(null)
  const chaveDaTela = `${estado.etapa}-${estado.indice}`

  // A cada tela, o foco vai para o título: o leitor de tela anuncia a nova pergunta
  // e quem usa teclado recomeça do topo.
  useEffect(() => {
    conteudo.current?.querySelector('h1')?.focus()
  }, [chaveDaTela])

  // O prazo de 30 min do complemento venceu: a avaliação está salva, não há o que repetir.
  const prazoVencido = fluxo.complemento.erro instanceof ErroApi && fluxo.complemento.erro.status === 401
  const erroDoComplemento = fluxo.complemento.erro
    ? prazoVencido
      ? 'O tempo para complementar terminou. Sua avaliação já está salva.'
      : `${mensagemDeErro(fluxo.complemento.erro, 'Não deu para enviar agora.')} Sua avaliação já está salva.`
    : null

  const voltar = (
    <BotaoDiscreto onClick={fluxo.voltar} className="-ml-4">
      <ArrowLeft aria-hidden className="size-6" />
      Voltar
    </BotaoDiscreto>
  )

  if (estado.etapa === 'abertura') {
    return (
      <Moldura>
        <div ref={conteudo} className="flex flex-1 flex-col justify-center">
          {/* os cinco rostos já carregam aqui, para não piscarem na primeira pergunta */}
          <div aria-hidden className="flex gap-2">
            {NIVEIS.map((nivel) => (
              <img key={nivel.valor} src={nivel.imagem} alt="" width={96} height={96} className="size-12 sm:size-14" />
            ))}
          </div>
          <Titulo className="mt-6 text-[2rem]/[1.1] sm:text-[2.5rem]/[1.1]">Como foi o seu atendimento?</Titulo>
          {/* o setor vem da URL do QR Code: fica bem visível para a pessoa conferir */}
          <p className="mt-4 text-muted-foreground">Você está avaliando</p>
          <p className="text-2xl font-semibold">{pesquisa.setor.nome}</p>
          <ul className="mt-6 grid gap-3">
            <li className="flex items-center gap-3">
              <ShieldCheck aria-hidden className="size-6 shrink-0 text-primary" />
              É anônimo: você não precisa dizer seu nome.
            </li>
            <li className="flex items-center gap-3">
              <Clock aria-hidden className="size-6 shrink-0 text-primary" />
              Leva menos de 2 minutos.
            </li>
          </ul>
          <BotaoPrincipal className="mt-8" onClick={fluxo.comecar}>
            Começar avaliação
          </BotaoPrincipal>
        </div>
      </Moldura>
    )
  }

  if (estado.etapa === 'agradecimento') {
    return (
      <Moldura progresso={1}>
        <div ref={conteudo} className="flex flex-1 flex-col">
          <TelaAgradecimento reinicio={reinicio} />
        </div>
      </Moldura>
    )
  }

  const rodape =
    estado.etapa === 'pergunta' ? (
      <>
        {voltar}
        <BotaoDiscreto onClick={fluxo.pular} className="-mr-4">
          Pular
        </BotaoDiscreto>
      </>
    ) : estado.etapa === 'comentario' ? null : (
      voltar
    )

  return (
    <Moldura progresso={fluxo.progresso} rodape={rodape}>
      <div ref={conteudo} key={chaveDaTela} className="flex flex-1 flex-col">
        {estado.etapa === 'data' && <EtapaData valor={estado.dataAtendimento} aoEscolher={fluxo.definirData} />}

        {estado.etapa === 'turno' && (
          <EtapaTurno turnos={pesquisa.turnos} valor={estado.turnoId} aoEscolher={fluxo.definirTurno} />
        )}

        {fluxo.perguntaAtual && (
          <>
            <Titulo>{fluxo.perguntaAtual.texto}</Titulo>
            <div className="mt-6">
              <Pergunta
                pergunta={fluxo.perguntaAtual}
                resposta={estado.respostas[fluxo.perguntaAtual.id]}
                limiteTexto={pesquisa.textoLimiteCaracteres}
                aoResponder={fluxo.responder}
              />
            </div>
          </>
        )}

        {estado.etapa === 'nps' && (
          <>
            <Titulo>{pesquisa.npsTexto}</Titulo>
            <div className="mt-6">
              <EscalaNps pergunta={pesquisa.npsTexto} valor={estado.nps} desabilitada={fluxo.envio.pendente} aoSelecionar={fluxo.selecionarNps} />
            </div>
            {fluxo.envio.erro && (
              <Aviso className="mt-5">
                {mensagemDeErro(fluxo.envio.erro, 'Não deu para enviar agora.')} Suas respostas continuam aqui.
              </Aviso>
            )}
            <BotaoPrincipal className="mt-6" disabled={estado.nps === null || fluxo.envio.pendente} onClick={fluxo.enviar}>
              {fluxo.envio.pendente ? 'Enviando…' : fluxo.envio.erro ? 'Tentar de novo' : 'Enviar avaliação'}
            </BotaoPrincipal>
            {estado.nps === null && <p className="mt-3 text-muted-foreground">Toque em uma nota para poder enviar.</p>}
          </>
        )}

        {estado.etapa === 'comentario' && estado.criada && (
          <EtapaComentario
            avaliacaoBaixa={estado.criada.classificacao !== 'NORMAL'}
            inicial={estado.comentario}
            limite={pesquisa.textoLimiteCaracteres}
            enviando={fluxo.complemento.pendente}
            erro={erroDoComplemento}
            aoEnviar={fluxo.comentar}
            aoPular={() => (prazoVencido ? fluxo.terminarSemComplemento() : fluxo.comentar(null))}
          />
        )}

        {estado.etapa === 'contato' && (
          <EtapaContato
            enviando={fluxo.complemento.pendente}
            erro={erroDoComplemento}
            aoEnviar={fluxo.concluir}
            aoRecusar={() => (prazoVencido ? fluxo.terminarSemComplemento() : fluxo.concluir())}
          />
        )}
      </div>
    </Moldura>
  )
}
