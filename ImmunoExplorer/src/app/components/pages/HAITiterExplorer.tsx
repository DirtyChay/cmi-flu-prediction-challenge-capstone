import { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { ChartCard, DarkSelect, NoData } from '../ChartCard';
import { BoxPlotChart } from '../BoxPlotChart';
import { HeatmapGrid } from '../HeatmapGrid';
import {
  STRAINS, getBoxPlotData, getHAIScatterData, haiHeatmap, ARM_COLORS, VACCINE_ARMS,
} from '../../data/mockData';

const axisStyle = { fill: '#64748B', fontSize: 11 };

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: (ARM_COLORS as any)[d?.arm] || '#2E86AB', fontWeight: 600, marginBottom: 4 }}>{d?.arm}</div>
      <div>Day 0: <span style={{ color: '#E2E8F0' }}>{d?.day0?.toFixed(2)}</span></div>
      <div>Day 28: <span style={{ color: '#E2E8F0' }}>{d?.day28?.toFixed(2)}</span></div>
    </div>
  );
}

const STRAIN_COLORS: Record<string, string> = {
  H1N1: '#2E86AB', H3N2: '#00D9C0', 'B/Victoria': '#F4A261', 'B/Yamagata': '#8B5CF6',
};

export function HAITiterExplorer() {
  const [strain, setStrain] = useState<string>(STRAINS[0]);

  const boxData = useMemo(() => getBoxPlotData(strain), [strain]);
  const scatterData = useMemo(() => getHAIScatterData(strain), [strain]);
  const strainColor = STRAIN_COLORS[strain] ?? '#2E86AB';

  // Heatmap: strains × vaccine arms
  const heatValues = haiHeatmap.map(row => row.values.map(v => v.mean));
  const heatRowLabels = haiHeatmap.map(r => r.strain);
  const heatColLabels = Array.from(VACCINE_ARMS);

  // Group scatter by arm
  const armGroups = Array.from(VACCINE_ARMS).map(arm => ({
    arm,
    color: (ARM_COLORS as any)[arm] ?? '#2E86AB',
    data: scatterData.filter(d => d.arm === arm),
  }));

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>HAI Titer Explorer</h1>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Hemagglutination Inhibition assay titers across timepoints
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Flu Strain:</span>
          <DarkSelect
            value={strain}
            onChange={setStrain}
            options={STRAINS.map(s => ({ value: s, label: s }))}
          />
        </div>
      </div>

      {/* Box plots */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard
          title={`HAI Titer by Timepoint — ${strain}`}
          subtitle="Box plots show median, IQR, and 1.5×IQR whiskers"
          minHeight={280}
        >
          {boxData.length > 0 ? (
            <BoxPlotChart data={boxData} color={strainColor} height={280} />
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>

      {/* Scatter + Heatmap side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Scatter Day0 vs Day28 */}
        <ChartCard
          title={`Day 0 vs Day 28 — ${strain}`}
          subtitle="Points colored by vaccine arm"
          minHeight={300}
        >
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            {Array.from(VACCINE_ARMS).map(arm => (
              <div key={arm} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#94A3B8' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: (ARM_COLORS as any)[arm], display: 'inline-block' }} />
                {arm}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number" dataKey="day0"
                name="Day 0" tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: 'Day 0 log₂ titer', position: 'insideBottom', offset: -12, style: { fill: '#64748B', fontSize: 10 } }}
              />
              <YAxis
                type="number" dataKey="day28"
                name="Day 28" tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: 'Day 28', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }}
              />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
              {armGroups.map(g => (
                <Scatter key={g.arm} name={g.arm} data={g.data} fill={g.color} opacity={0.75}>
                  {g.data.map((_, i) => <Cell key={i} fill={g.color} />)}
                </Scatter>
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Heatmap: strains × vaccine arms mean D28 */}
        <ChartCard
          title="Mean Day-28 Titer Heatmap"
          subtitle="log₂ HAI titer — strain × vaccine arm"
          minHeight={300}
        >
          <HeatmapGrid
            rowLabels={heatRowLabels}
            colLabels={heatColLabels}
            values={heatValues}
            colorMin="#0F1117"
            colorMax="#2E86AB"
            formatVal={v => v.toFixed(1)}
          />
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#64748B' }}>Low</span>
            <div style={{
              flex: 1, height: 6, borderRadius: 3,
              background: 'linear-gradient(to right, #0F1117, #2E86AB)',
            }} />
            <span style={{ fontSize: 10, color: '#64748B' }}>High</span>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
