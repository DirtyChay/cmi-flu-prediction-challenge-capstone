import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, Legend,
} from 'recharts';
import { ChartCard, DarkSelect, DarkTooltip } from '../ChartCard';
import { HeatmapGrid } from '../HeatmapGrid';
import {
  STRAINS, correlationMatrix, immuneFeatures,
  getScatterData, SCATTER_FIELDS, ScatterField, CHART_COLORS,
} from '../../data/mockData';

const axisStyle = { fill: '#64748B', fontSize: 11 };

const COLOR_BY_OPTIONS = [
  { value: 'arm',    label: 'Vaccine Arm' },
  { value: 'sex',    label: 'Sex' },
  { value: 'cohort', label: 'Cohort' },
] as const;

const GROUP_COLORS: Record<string, string> = {
  'TIV-HD': '#2E86AB', 'TIV-SD': '#00D9C0', LAIV: '#F4A261', Placebo: '#8B5CF6',
  Male: '#2E86AB', Female: '#F4A261',
  'High-Dose TIV': '#2E86AB', 'Standard TIV': '#00D9C0',
};

function ScatterExplorerTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
    }}>
      <div style={{ color: GROUP_COLORS[d?.group] || '#2E86AB', fontWeight: 600, marginBottom: 4 }}>{d?.group}</div>
      <div>X: <span style={{ color: '#E2E8F0' }}>{d?.x?.toFixed(3)}</span></div>
      <div>Y: <span style={{ color: '#E2E8F0' }}>{d?.y?.toFixed(3)}</span></div>
    </div>
  );
}

export function FeatureCorrelations() {
  const [xField, setXField] = useState<ScatterField>('H1N1 D0');
  const [yField, setYField] = useState<ScatterField>('H3N2 D0');
  const [colorBy, setColorBy] = useState<'arm' | 'sex' | 'cohort'>('arm');

  const corrValues = STRAINS.map((_, ri) => correlationMatrix[ri].map(c => c.r));
  const strainLabels = Array.from(STRAINS);

  const scatterData = useMemo(() => getScatterData(xField, yField, colorBy), [xField, yField, colorBy]);

  const groups = [...new Set(scatterData.map(d => d.group))];
  const grouped = groups.map(g => ({
    g,
    color: GROUP_COLORS[g] || CHART_COLORS[groups.indexOf(g) % CHART_COLORS.length],
    data: scatterData.filter(d => d.group === g),
  }));

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Feature Correlations</h1>
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          Baseline immunological feature relationships across participants
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Correlation heatmap */}
        <ChartCard
          title="Baseline Titer Correlations"
          subtitle="Pearson r — Day-0 log₂ titers between strains"
          minHeight={260}
        >
          <HeatmapGrid
            rowLabels={strainLabels}
            colLabels={strainLabels}
            values={corrValues}
            diverging={true}
            formatVal={v => v.toFixed(2)}
          />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#64748B' }}>−1</span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'linear-gradient(to right, #EF4444, #1E2130, #2E86AB)',
            }} />
            <span style={{ fontSize: 10, color: '#64748B' }}>+1</span>
          </div>
        </ChartCard>

        {/* Scatter explorer */}
        <ChartCard
          title="Scatter Explorer"
          subtitle="Interactive feature comparison"
          minHeight={260}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#64748B', fontSize: 11 }}>X:</span>
              <DarkSelect value={xField} onChange={v => setXField(v as ScatterField)}
                options={SCATTER_FIELDS.map(f => ({ value: f, label: f }))} />
              <span style={{ color: '#64748B', fontSize: 11 }}>Y:</span>
              <DarkSelect value={yField} onChange={v => setYField(v as ScatterField)}
                options={SCATTER_FIELDS.map(f => ({ value: f, label: f }))} />
              <span style={{ color: '#64748B', fontSize: 11 }}>Color:</span>
              <DarkSelect value={colorBy} onChange={v => setColorBy(v as any)}
                options={COLOR_BY_OPTIONS.map(o => ({ value: o.value, label: o.label }))} />
            </div>
          }
        >
          {/* Legend */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            {grouped.map(({ g, color }) => (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {g}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number" dataKey="x" name={xField}
                tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: xField, position: 'insideBottom', offset: -14, style: { fill: '#64748B', fontSize: 10 } }}
              />
              <YAxis
                type="number" dataKey="y" name={yField}
                tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: yField, angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }}
              />
              <Tooltip content={<ScatterExplorerTooltip />} />
              {grouped.map(({ g, color, data }) => (
                <Scatter key={g} name={g} data={data} fill={color} opacity={0.7} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Grouped bar: immune cell features Day0 vs Day7 */}
      <ChartCard
        title="Top Immune Cell Features"
        subtitle="Relative abundance — Day 0 vs Day 7 post-vaccination"
        minHeight={240}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
          {[
            { label: 'Day 0', color: '#2E86AB' },
            { label: 'Day 7', color: '#00D9C0' },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
              <span style={{ width: 12, height: 3, background: color, display: 'inline-block', borderRadius: 2 }} />
              {label}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={immuneFeatures} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="feature" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="day0" name="Day 0" fill="#2E86AB" radius={[3, 3, 0, 0]} />
            <Bar dataKey="day7" name="Day 7" fill="#00D9C0" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
