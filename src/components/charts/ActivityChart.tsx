import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import type { ActivityPoint } from '@/services/stats'
import { ChartTooltipBox, axisProps, gridProps } from './ChartTooltip'

export function ActivityChart({ data, height = 260 }: { data: ActivityPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="g-brain" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-brain)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-brain)" stopOpacity={0} /></linearGradient>
          <linearGradient id="g-spine" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-spine)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-spine)" stopOpacity={0} /></linearGradient>
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={18} />
        <YAxis {...axisProps} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          content={({ active, payload, label }) => (active && payload?.length ? <ChartTooltipBox title={label} rows={[{ label: 'Brain', value: payload.find((p) => p.dataKey === 'brain')?.value ?? 0, color: 'var(--chart-brain)' }, { label: 'Spine', value: payload.find((p) => p.dataKey === 'spine')?.value ?? 0, color: 'var(--chart-spine)' }, { label: 'Total', value: payload[0]?.payload?.total ?? 0 }]} /> : null)}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="brain" name="Brain (incl. neurovascular)" stroke="var(--chart-brain)" strokeWidth={2} fill="url(#g-brain)" dot={false} activeDot={{ r: 4 }} isAnimationActive />
        <Area type="monotone" dataKey="spine" name="Spine" stroke="var(--chart-spine)" strokeWidth={2} fill="url(#g-spine)" dot={false} activeDot={{ r: 4 }} isAnimationActive />
      </AreaChart>
    </ResponsiveContainer>
  )
}
