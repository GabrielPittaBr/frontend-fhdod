import { Check } from 'lucide-react'
import { NIVEIS } from '@/lib/escala'
import { cn } from '@/lib/utils'
import { useEscolha } from '../hooks/useEscolha'

/**
 * Escala de 1 a 5: rosto colorido + texto + cor de apoio, sempre de "Muito ruim" a "Muito bom"
 * no sentido da leitura. Em espaço estreito vira lista (texto grande); com 560 px ou mais, uma fileira.
 * A medida é a do recipiente (@container), não a da janela: assim a prévia do painel mostra a versão de celular.
 */
export function EscalaRostinhos({
  pergunta,
  valor,
  aoEscolher,
}: {
  pergunta: string
  valor?: number
  aoEscolher: (valor: number) => void
}) {
  const { recente, escolher } = useEscolha(aoEscolher)
  const marcado = recente ?? valor

  return (
    <div role="group" aria-label={pergunta} className="grid gap-2.5 @min-[560px]:grid-cols-5 @min-[560px]:gap-3">
      {NIVEIS.map((nivel) => {
        const selecionado = marcado === nivel.valor
        return (
          <button
            key={nivel.valor}
            type="button"
            aria-pressed={selecionado}
            aria-label={`${nivel.valor}, ${nivel.rotulo}`}
            onClick={() => escolher(nivel.valor)}
            style={{
              backgroundColor: selecionado ? nivel.fundoForte : nivel.fundo,
              borderColor: selecionado ? 'var(--foreground)' : nivel.borda,
            }}
            className={cn(
              'relative flex min-h-16 items-center gap-4 rounded-2xl border-2 px-4 py-2 text-left',
              'transition-[opacity,transform,box-shadow] duration-150 active:scale-[0.985]',
              '@min-[560px]:flex-col @min-[560px]:gap-3 @min-[560px]:px-2 @min-[560px]:pt-5 @min-[560px]:pb-4 @min-[560px]:text-center',
              selecionado && 'shadow-[0_0_0_2px_var(--foreground)]',
              recente !== null && !selecionado && 'opacity-40',
            )}
          >
            <img src={nivel.imagem} alt="" width={96} height={96} draggable={false} className="size-12 shrink-0 @min-[560px]:size-20" />
            <span className="flex-1 text-xl font-semibold @min-[560px]:flex @min-[560px]:flex-none @min-[560px]:items-center @min-[560px]:text-lg/tight">{nivel.rotulo}</span>
            {selecionado && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background @min-[560px]:absolute @min-[560px]:top-2 @min-[560px]:right-2 @min-[560px]:size-7">
                <Check aria-hidden className="size-5" strokeWidth={3.5} />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
