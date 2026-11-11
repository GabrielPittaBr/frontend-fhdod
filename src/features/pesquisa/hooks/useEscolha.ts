import { useEffect, useRef, useState } from 'react'

/**
 * Um toque responde e avança, mas só depois de mostrar por um instante o que foi escolhido.
 * Enquanto isso, toques repetidos são ignorados.
 */
export function useEscolha<T>(aoEscolher: (valor: T) => void) {
  const [recente, setRecente] = useState<T | null>(null)
  const espera = useRef(0)

  useEffect(() => () => window.clearTimeout(espera.current), [])

  function escolher(valor: T) {
    if (recente !== null) return
    setRecente(valor)
    espera.current = window.setTimeout(() => {
      setRecente(null)
      aoEscolher(valor)
    }, 450)
  }

  return { recente, escolher }
}
