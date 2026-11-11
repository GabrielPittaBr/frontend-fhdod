/**
 * Barra horizontal fina (até 16 px), com a ponta arredondada e a base reta.
 * O valor sempre aparece escrito ao lado: a barra só ajuda a comparar.
 * Aceita escala com negativos (NPS vai de −100 a +100): o zero vira a linha de base.
 */
export function Barra({
  valor,
  minimo = 0,
  maximo = 100,
  cor = 'var(--primary)',
}: {
  valor: number
  minimo?: number
  maximo?: number
  cor?: string
}) {
  const faixa = maximo - minimo
  const zero = ((0 - minimo) / faixa) * 100
  const largura = (Math.min(Math.abs(valor), faixa) / faixa) * 100
  const negativo = valor < 0
  return (
    <span aria-hidden className="relative block h-4 border-l border-input" style={{ marginLeft: minimo < 0 ? 0 : undefined }}>
      {minimo < 0 && <span className="absolute inset-y-0 w-px bg-input" style={{ left: `${zero}%` }} />}
      <span
        className="absolute inset-y-0.5"
        style={{
          left: `${negativo ? zero - largura : zero}%`,
          width: `${Math.max(largura, 0.5)}%`,
          backgroundColor: negativo ? 'var(--nota-2)' : cor,
          borderRadius: negativo ? '4px 0 0 4px' : '0 4px 4px 0',
        }}
      />
    </span>
  )
}
