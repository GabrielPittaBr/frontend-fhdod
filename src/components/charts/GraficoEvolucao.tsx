import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Granularidade, PontoEvolucao } from '@/lib/api/tipos'
import { npsComSinal, numero, rotuloDoPeriodo } from '@/lib/format'

const margem = { top: 8, right: 12, bottom: 0, left: 0 }

function Dica({ ponto, granularidade }: { ponto: PontoEvolucao; granularidade: Granularidade }) {
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground">
      <p className="text-xs text-muted-foreground">{rotuloDoPeriodo(ponto.periodo, granularidade, true)}</p>
      <p className="font-semibold">NPS {ponto.nps === null ? 'sem respostas' : npsComSinal(ponto.nps)}</p>
      <p className="text-muted-foreground">{numero(ponto.total)} respostas</p>
    </div>
  )
}

/**
 * Evolução do NPS (linha) e, logo abaixo, o volume de respostas de cada período (colunas).
 * São dois gráficos alinhados, cada um com o seu eixo: nota e volume nunca dividem a mesma escala.
 * Os mesmos números ficam na tabela ao lado, então o desenho é escondido do leitor de tela.
 */
export function GraficoEvolucao({
  dados,
  granularidade,
  altura = 220,
  fonte = 12,
}: {
  dados: PontoEvolucao[]
  granularidade: Granularidade
  altura?: number
  /** tamanho do texto dos eixos, em px: maior na TV, lida de longe */
  fonte?: number
}) {
  const escala = fonte / 12
  const eixo = { fill: 'var(--muted-foreground)', fontSize: fonte }
  const larguraDoEixo = Math.round(fonte * 3.7)
  const piso = Math.floor(Math.min(0, ...dados.map((p) => p.nps ?? 0)) / 50) * 50

  return (
    <div aria-hidden>
      <ResponsiveContainer width="100%" height={altura}>
        <LineChart data={dados} margin={margem} syncId="evolucao">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="periodo" hide />
          <YAxis
            domain={[piso, 100]}
            ticks={piso < 0 ? [piso, 0, 50, 100] : [0, 25, 50, 75, 100]}
            width={larguraDoEixo}
            tickLine={false}
            axisLine={false}
            tick={eixo}
            tickFormatter={npsComSinal}
          />
          {piso < 0 && <ReferenceLine y={0} stroke="var(--input)" />}
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: 'var(--input)' }}
            content={({ active, payload }) => {
              const ponto = payload?.[0]?.payload as PontoEvolucao | undefined
              return active && ponto ? <Dica ponto={ponto} granularidade={granularidade} /> : null
            }}
          />
          <Line
            type="linear"
            dataKey="nps"
            stroke="var(--primary)"
            strokeWidth={2 * escala}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={dados.length <= 16 ? { r: 3 * escala, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 * escala } : false}
            activeDot={{ r: 5 * escala, fill: 'var(--primary)', stroke: 'var(--background)', strokeWidth: 2 * escala }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={Math.round(altura * 0.36 + fonte * 2.4)}>
        <BarChart data={dados} margin={margem} syncId="evolucao">
          <XAxis
            dataKey="periodo"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={eixo}
            minTickGap={28 * escala}
            height={Math.round(fonte * 2.4)}
            tickFormatter={(periodo: string) => rotuloDoPeriodo(periodo, granularidade)}
          />
          <YAxis width={larguraDoEixo} tickLine={false} axisLine={false} tick={eixo} allowDecimals={false} tickCount={3} />
          <Tooltip content={() => null} cursor={{ fill: 'var(--muted)' }} />
          <Bar dataKey="total" fill="var(--input)" radius={[4 * escala, 4 * escala, 0, 0]} maxBarSize={24 * escala} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
