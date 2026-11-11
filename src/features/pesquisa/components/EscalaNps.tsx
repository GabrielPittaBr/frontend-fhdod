import { cn } from '@/lib/utils'

/**
 * Nota de 0 a 10 em botões grandes: duas linhas no celular, uma só em telas largas.
 * O toque apenas seleciona; quem confirma é o botão "Enviar avaliação" (protege de toque acidental).
 */
export function EscalaNps({
  pergunta,
  valor,
  desabilitada = false,
  aoSelecionar,
}: {
  pergunta: string
  valor: number | null
  desabilitada?: boolean
  aoSelecionar: (nota: number) => void
}) {
  return (
    <div>
      <div role="group" aria-label={pergunta} className="grid grid-cols-6 gap-1.5 @min-[560px]:grid-cols-11 @min-[560px]:gap-2">
        {Array.from({ length: 11 }, (_, nota) => (
          <button
            key={nota}
            type="button"
            disabled={desabilitada}
            aria-pressed={valor === nota}
            aria-label={nota === 0 ? '0, nada provável' : nota === 10 ? '10, muito provável' : String(nota)}
            onClick={() => aoSelecionar(nota)}
            className={cn(
              'numeros flex h-14 items-center justify-center rounded-xl border-2 text-2xl font-bold',
              'transition-[background-color,border-color,color,transform] duration-150 active:scale-95',
              valor === nota
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-card hover:border-primary',
            )}
          >
            {nota}
          </button>
        ))}
      </div>
      <p aria-hidden className="mt-3 flex flex-wrap justify-between gap-x-6 gap-y-1 text-lg text-muted-foreground">
        <span>0 = nada provável</span>
        <span>10 = muito provável</span>
      </p>
    </div>
  )
}
