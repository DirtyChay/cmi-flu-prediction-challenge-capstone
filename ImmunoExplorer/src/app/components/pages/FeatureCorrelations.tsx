import { useState, useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, BarChart, Bar,
} from 'recharts';
import { ChartCard, DarkSelect, DarkTooltip } from '../ChartCard';
import { HeatmapGrid } from '../HeatmapGrid';
import {
  CORR_GROUPS, getGroupCorrelation, foldRiseByArm, VACCINE_ARMS,
  getScatterData, SCATTER_FIELDS, ScatterField, CHART_COLORS, ARM_COLORS,
  strainShortLabel,
} from '../../data/mockData';

const axisStyle = { fill: '#64748B', fontSize: 11 };

const COLOR_BY_OPTIONS = [
  { value: 'arm', label: 'Vaccine Arm' },
  { value: 'sex', label: 'Sex' },
] as const;

function groupColor(g: string): string {
  return ARM_COLORS[g] ?? (g === 'Male' ? '#2E86AB' : g === 'Female' ? '#F4A261' : '#8B5CF6');
}

function ScatterExplorerTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
    }}>
      <div style={{ color: groupColor(d?.group), fontWeight: 600, marginBottom: 4 }}>{d?.group}</div>
      <div>X: <span style={{ color: '#E2E8F0' }}>{d?.x?.toFixed(3)}</span></div>
      <div>Y: <span style={{ color: '#E2E8F0' }}>{d?.y?.toFixed(3)}</span></div>
    </div>
  );
}

export function FeatureCorrelations() {
  const [xField, setXField] = useState<ScatterField>('Age');
  const [yField, setYField] = useState<ScatterField>(SCATTER_FIELDS[2] ?? SCATTER_FIELDS[1] ?? 'Age');
  const [colorBy, setColorBy] = useState<'arm' | 'sex'>('arm');
  const [corrGroup, setCorrGroup] = useState<string>(CORR_GROUPS[0]?.value ?? '');

  const corr = useMemo(() => getGroupCorrelation(corrGroup), [corrGroup]);
  const corrShort = corr.strains.map(strainShortLabel);
  const corrGroupLabel = CORR_GROUPS.find(g => g.value === corrGroup)?.label ?? corrGroup;

  const scatterData = useMemo(() => getScatterData(xField, yField, colorBy), [xField, yField, colorBy]);

  const groups = [...new Set(scatterData.map(d => d.group))];
  const grouped = groups.map((g, i) => ({
    g,
    color: groupColor(g) || CHART_COLORS[i % CHART_COLORS.length],
    data: scatterData.filter(d => d.group === g),
  }));

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Feature Correlations</h1>
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          Baseline titer relationships across participants
        </p>
      </div>

      {/* Correlation heatmap — full width */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard
          title={`Baseline Titer Correlations — ${corrGroupLabel}`}
          subtitle="How similarly two strains' Day-0 titers move across participants (Pearson r). Blue = rise together, red = opposite, dark = unrelated. Ordered oldest → newest."
          minHeight={260}
          actions={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#64748B', fontSize: 11 }}>Subtype:</span>
              <DarkSelect value={corrGroup} onChange={setCorrGroup}
                options={CORR_GROUPS.map(g => ({ value: g.value, label: g.label }))} />
            </div>
          }
        >
          {corr.strains.length < 2 ? (
            <div style={{ color: '#475569', fontSize: 13, padding: '24px 0' }}>
              Not enough well-measured strains in this subtype to compute correlations.
            </div>
          ) : (
          <HeatmapGrid
            rowLabels={corrShort}
            colLabels={corrShort}
            rowTitles={corr.strains}
            colTitles={corr.strains}
            values={corr.matrix}
            diverging={true}
            rotateColLabels={true}
            cellMinWidth={40}
            cellHeight={30}
            rowLabelWidth={120}
            formatVal={v => v.toFixed(2)}
          />
          )}
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, maxWidth: 360 }}>
            <span style={{ fontSize: 10, color: '#64748B' }}>−1 opposite</span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'linear-gradient(to right, #EF4444, #1E2130, #2E86AB)',
            }} />
            <span style={{ fontSize: 10, color: '#64748B' }}>+1 together</span>
          </div>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Scatter explorer */}
        <ChartCard
          title="Compare Any Two Measurements"
          subtitle="Each dot = one participant. Pick an X and Y to see if they move together."
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

        {/* Vaccine response: mean fold rise by arm */}
        <ChartCard
          title="Did Antibodies Rise After Vaccination?"
          subtitle="Average titer increase (Day 0 → Day 28) by flu family and vaccine arm. Taller bar = bigger jump; +1 ≈ doubling."
          minHeight={240}
        >
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
          {VACCINE_ARMS.map(arm => (
            <div key={arm} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
              <span style={{ width: 12, height: 3, background: ARM_COLORS[arm], display: 'inline-block', borderRadius: 2 }} />
              {arm}
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={foldRiseByArm} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="group" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false}
              label={{ value: 'avg titer rise (log₂)', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            {VACCINE_ARMS.map(arm => (
              <Bar key={arm} dataKey={arm} name={arm} fill={ARM_COLORS[arm]} radius={[3, 3, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
