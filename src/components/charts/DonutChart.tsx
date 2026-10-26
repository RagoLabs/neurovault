import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltipBox } from './ChartTooltip'

export interface DonutDatum { key: string; name: string; value: number; color: string }

export function DonutChart({ data, total, centerLabel = 'Procedures', height = 220 }: { data: DonutDatum[]; total?: number; centerLabel?: string; height?: number }) {
  const sum = total ?? data.reduce((a, b) => a + b.value, 0)
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full sm:w-1/2" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="92%" paddingAngle={3} cornerRadius={6} stroke="none" isAnimationActive>
              {data.map((d) => <Cell key={d.key} fill={d.color} />)}
            </Pie>
            <Tooltip content={({ active, payload }) => (active && payload?.length ? <ChartTooltipBox title={payload[0].name as string} rows={[{ label: 'Procedures', value: payload[0].value as number }, { label: 'Share', value: `${sum ? Math.round(((payload[0].value as number) / sum) * 100) : 0}%` }]} /> : null)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-3xl font-bold tabular-nums">{sum}</span>
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full space-y-2 sm:w-1/2">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
            <span className="inline-flex items-center gap-2 min-w-0"><span className="size-2.5 shrink-0 rounded-full" style={{ background: d.color }} /><span className="truncate">{d.name}</span></span>
            <span className="font-data tabular-nums text-muted-foreground"><span className="font-semibold text-foreground">{d.value}</span> · {sum ? Math.round((d.value / sum) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
