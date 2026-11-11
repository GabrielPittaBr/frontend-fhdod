import { useEffect, useEffectEvent, useState } from 'react'

/** Contagem regressiva que começa quando o componente aparece. */
export function useContagem(segundos: number, aoZerar: () => void) {
  const [restam, setRestam] = useState(segundos)
  const zerou = useEffectEvent(aoZerar)

  useEffect(() => {
    const fim = Date.now() + segundos * 1000
    const relogio = window.setInterval(() => {
      const faltam = Math.max(0, Math.ceil((fim - Date.now()) / 1000))
      setRestam(faltam)
      if (faltam === 0) {
        window.clearInterval(relogio)
        zerou()
      }
    }, 250)
    return () => window.clearInterval(relogio)
  }, [segundos])

  return restam
}

/**
 * Comportamento do aparelho no modo totem: tela cheia ao primeiro toque, tela sempre acesa,
 * sem zoom nem menu de contexto. O bloqueio de zoom vale só aqui: na pesquisa pelo celular
 * o zoom do navegador continua funcionando.
 */
export function useModoTotem() {
  useEffect(() => {
    const html = document.documentElement
    const viewport = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')
    const original = viewport?.content
    html.classList.add('totem')
    if (viewport) viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'

    const telaCheia = () => {
      if (!document.fullscreenElement) html.requestFullscreen?.().catch(() => undefined)
    }
    const semMenu = (evento: Event) => evento.preventDefault()

    // Screen Wake Lock, quando o navegador permitir. A trava cai ao trocar de aba: pede de novo ao voltar.
    let trava: WakeLockSentinel | undefined
    const manterAcesa = () => {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock
        ?.request('screen')
        .then((nova) => (trava = nova))
        .catch(() => undefined)
    }
    manterAcesa()

    document.addEventListener('pointerdown', telaCheia)
    document.addEventListener('contextmenu', semMenu)
    document.addEventListener('visibilitychange', manterAcesa)
    return () => {
      document.removeEventListener('pointerdown', telaCheia)
      document.removeEventListener('contextmenu', semMenu)
      document.removeEventListener('visibilitychange', manterAcesa)
      html.classList.remove('totem')
      if (viewport && original) viewport.content = original
      void trava?.release()
    }
  }, [])
}

/** Sem toque no meio da pesquisa por `segundos`: hora de perguntar "Ainda está aí?". */
export function useInatividade(emAndamento: boolean, segundos: number) {
  const [avisando, setAvisando] = useState(false)

  useEffect(() => {
    if (!emAndamento || avisando) return
    let espera = 0
    const reiniciarEspera = () => {
      window.clearTimeout(espera)
      espera = window.setTimeout(() => setAvisando(true), segundos * 1000)
    }
    reiniciarEspera()
    const eventos = ['pointerdown', 'keydown', 'input'] as const
    eventos.forEach((evento) => document.addEventListener(evento, reiniciarEspera))
    return () => {
      window.clearTimeout(espera)
      eventos.forEach((evento) => document.removeEventListener(evento, reiniciarEspera))
    }
  }, [emAndamento, avisando, segundos])

  return { avisando: avisando && emAndamento, continuar: () => setAvisando(false) }
}
