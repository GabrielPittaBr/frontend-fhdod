import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { classeDaSelecao } from '@/components/formulario'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { listarTurnos } from '@/features/cadastros/api'
import { listarSetores } from '@/features/setores/api'
import { isoDoDia } from '@/lib/format'
import { ROTULO_CANAL } from '@/lib/rotulos'
import { PERIODOS, type Periodo, type useFiltros } from '../filtros'

export function Filtro({ rotulo, id, children }: { rotulo: string; id: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {children}
    </div>
  )
}

/**
 * Uma só linha de filtros acima de tudo o que eles afetam: todos os blocos leem o mesmo recorte.
 * Usada no dashboard e na lista de respostas (que acrescenta os seus filtros em `children`).
 */
export function Filtros({ periodo, filtros, alterar, children }: ReturnType<typeof useFiltros> & { children?: ReactNode }) {
  const setores = useQuery({ queryKey: ['setores'], queryFn: listarSetores })
  const turnos = useQuery({ queryKey: ['turnos'], queryFn: listarTurnos })
  const hoje = isoDoDia()

  return (
    <form aria-label="Filtros dos indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" onSubmit={(e) => e.preventDefault()}>
      <Filtro rotulo="Período" id="f-periodo">
        <select
          id="f-periodo"
          className={classeDaSelecao}
          value={periodo}
          onChange={(e) =>
            alterar(
              e.target.value === 'datas'
                ? { periodo: 'datas', inicio: filtros.inicio, fim: filtros.fim }
                : { periodo: e.target.value === '30d' ? null : e.target.value, inicio: null, fim: null },
            )
          }
        >
          {(Object.keys(PERIODOS) as Periodo[]).map((p) => (
            <option key={p} value={p}>
              {PERIODOS[p]}
            </option>
          ))}
        </select>
      </Filtro>
      <Filtro rotulo="Data considerada" id="f-base">
        <select id="f-base" name="base" className={classeDaSelecao} value={filtros.base} onChange={(e) => alterar({ base: e.target.value === 'ENVIO' ? 'envio' : null })}>
          <option value="ATENDIMENTO">Dia do atendimento</option>
          <option value="ENVIO">Dia do envio da resposta</option>
        </select>
      </Filtro>
      <Filtro rotulo="Setor" id="f-setor">
        <select id="f-setor" name="setor" className={classeDaSelecao} value={filtros.setorId ?? ''} onChange={(e) => alterar({ setor: e.target.value })}>
          <option value="">Todos os setores</option>
          {setores.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
              {s.ativo ? '' : ' (inativo)'}
            </option>
          ))}
        </select>
      </Filtro>
      <Filtro rotulo="Turno" id="f-turno">
        <select id="f-turno" name="turno" className={classeDaSelecao} value={filtros.turnoId ?? ''} onChange={(e) => alterar({ turno: e.target.value })}>
          <option value="">Todos os turnos</option>
          {turnos.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </Filtro>
      <Filtro rotulo="Canal" id="f-canal">
        <select id="f-canal" name="canal" className={classeDaSelecao} value={filtros.canal ?? ''} onChange={(e) => alterar({ canal: e.target.value })}>
          <option value="">Todos os canais</option>
          <option value="WEB">{ROTULO_CANAL.WEB}</option>
          <option value="TOTEM">{ROTULO_CANAL.TOTEM}</option>
        </select>
      </Filtro>
      {children}
      {periodo === 'datas' && (
        <>
          <Filtro rotulo="De" id="f-inicio">
            <Input id="f-inicio" name="inicio" type="date" max={filtros.fim} value={filtros.inicio} onChange={(e) => alterar({ inicio: e.target.value })} />
          </Filtro>
          <Filtro rotulo="Até" id="f-fim">
            <Input id="f-fim" name="fim" type="date" min={filtros.inicio} max={hoje} value={filtros.fim} onChange={(e) => alterar({ fim: e.target.value })} />
          </Filtro>
        </>
      )}
    </form>
  )
}
