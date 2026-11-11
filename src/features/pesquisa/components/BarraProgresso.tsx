/** Progresso por proporção: mostra o quanto falta sem dizer "3 de 12". */
export function BarraProgresso({ valor }: { valor: number }) {
  const percentual = Math.round(valor * 100)
  return (
    <div
      role="progressbar"
      aria-label="Andamento da avaliação"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentual}
      className="h-2.5 flex-1 overflow-hidden rounded-full bg-border"
    >
      <div
        className="h-full origin-left rounded-full bg-primary transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${Math.max(valor, 0.03)})` }}
      />
    </div>
  )
}
