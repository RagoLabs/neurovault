import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltipBox, axisProps, gridProps } from './ChartTooltip'

export function SimpleBarChart({ data, height = 240, color = 'var(--chart-spine)', layout = 'horizontal', valueLabel = 'Count', colors }: { data: { label: string; value: number }[]; height?: number; color?: string; layout?: 'horizontal' | 'vertical'; valueLabel?: string; colors?: string[] }) {
  const vertical = layout === 'vertical'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout={vertical ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, left: vertical ? 10 : -18, bottom: 0 }}>
        <CartesianGrid {...gridProps} vertical={vertical} horizontal={!vertical} />
        {vertical ? <><XAxis type="number" {...axisProps} allowDecimals={false} /><YAxis type="category" dataKey="label" {...axisProps} width={120} /></> : <><XAxis dataKey="label" {...axisProps} interval={0} minTickGap={6} /><YAxis {...axisProps} allowDecimals={false} /></>}
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={({ active, payload, label }) => (active && payload?.length ? <ChartTooltipBox title={label} rows={[{ label: valueLabel, value: payload[0].value as number }]} /> : null)} />
        <Bar dataKey="value" radius={vertical ? [0, 6, 6, 0] : [6, 6, 0, 0]} fill={color} isAnimationActive>
          {colors && data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
