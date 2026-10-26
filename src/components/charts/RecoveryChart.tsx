import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { ChartTooltipBox, axisProps, gridProps } from './ChartTooltip'

export interface RecoverySeries { key: string; name: string; color: string; domain?: [number, number] }

/**
 * Longitudinal recovery chart. Null values produce gaps (connectNulls=false)
 * so missing data is never drawn as a trend.
 */
export function RecoveryChart({ data, series, height = 240, yDomain }: { data: Record<string, string | number | null>[]; series: RecoverySeries[]; height?: number; yDomain?: [number, number] }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} domain={yDomain ?? ['auto', 'auto']} allowDecimals={false} />
        <Tooltip content={({ active, payload, label }) => (active && payload?.length ? <ChartTooltipBox title={label} rows={series.map((s) => ({ label: s.name, color: s.color, value: payload.find((p) => p.dataKey === s.key)?.value ?? 'Not recorded' }))} /> : null)} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }} activeDot={{ r: 6 }} connectNulls={false} isAnimationActive />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
