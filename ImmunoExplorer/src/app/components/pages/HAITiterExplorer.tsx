import { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ReferenceLine,
  BarChart, Bar,
} from 'recharts';
import { ChartCard, DarkSelect, DarkTooltip, NoData } from '../ChartCard';
import { BoxPlotChart } from '../BoxPlotChart';
import {
  STRAINS, getBoxPlotData, getHAIScatterData, getStrainSummary, getArmTimepointMeans,
  ARM_COLORS, VACCINE_ARMS, strainColor,
} from '../../data/mockData';

const axisStyle = { fill: '#64748B', fontSize: 11 };
const TIMEPOINT_COLORS: Record<string, string> = { 'Day 0': '#8B5CF6', 'Day 28': '#2E86AB', 'Day 365': '#00D9C0' };

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const rise = (d.day28 ?? 0) - (d.day0 ?? 0);
  return (
    <div style={{
      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
      boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ color: (ARM_COLORS as any)[d?.arm] || '#2E86AB', fontWeight: 600, marginBottom: 4 }}>{d?.arm}</div>
      <div>Day 0: <span style={{ color: '#E2E8F0' }}>{d?.day0?.toFixed(2)}</span></div>
      <div>Day 28: <span style={{ color: '#E2E8F0' }}>{d?.day28?.toFixed(2)}</span></div>
      <div>Change: <span style={{ color: rise >= 0 ? '#06D6A0' : '#EF4444' }}>{rise >= 0 ? '+' : ''}{rise.toFixed(2)}</span></div>
    </div>
  );
}

export function HAITiterExplorer() {
  const [strain, setStrain] = useState<string>(STRAINS[0]);

  const boxData = useMemo(() => getBoxPlotData(strain), [strain]);
  const scatterData = useMemo(() => getHAIScatterData(strain), [strain]);
  const summary = useMemo(() => getStrainSummary(strain), [strain]);
  const armMeans = useMemo(() => getArmTimepointMeans(strain), [strain]);
  const color = strainColor(strain);

  // Group scatter by arm
  const armGroups = Array.from(VACCINE_ARMS).map(arm => ({
    arm,
    color: (ARM_COLORS as any)[arm] ?? '#2E86AB',
    data: scatterData.filter(d => d.arm === arm),
  }));

  // Square domain for the Day0/Day28 scatter so the y=x diagonal is meaningful
  const allVals = scatterData.flatMap(d => [d.day0, d.day28]);
  const lo = allVals.length ? Math.floor(Math.min(...allVals)) : 0;
  const hi = allVals.length ? Math.ceil(Math.max(...allVals)) : 1;

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

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: '% Participants Measured', value: `${summary.coveragePct}%`, hint: `${summary.nParticipants.toLocaleString()} of ${summary.total.toLocaleString()}`, accent: true },
          { label: 'Measured (D0)', value: summary.nD0.toLocaleString() },
          { label: 'Measured (D28)', value: summary.nD28.toLocaleString() },
          { label: 'Median D0', value: summary.medianD0.toFixed(2) },
          { label: 'Median D28', value: summary.medianD28.toFixed(2) },
          { label: 'Median Fold Rise', value: (summary.medianRise >= 0 ? '+' : '') + summary.medianRise.toFixed(2), tip: 'Median of (Day 28 − Day 0) across participants. Titers are log₂, so +1 = 2× titer, +2 = 4× (the seroconversion threshold), 0 = no change.' },
        ].map(s => (
          <div key={s.label} title={s.tip} style={{
            background: '#1E2130', borderRadius: 10,
            border: s.accent ? '1px solid rgba(46,134,171,0.4)' : '1px solid rgba(255,255,255,0.07)',
            padding: '12px 14px',
            cursor: s.tip ? 'help' : 'default',
          }}>
            <div style={{ color: s.accent ? '#2E86AB' : '#E2E8F0', fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
            <div style={{ color: '#64748B', fontSize: 11, marginTop: 5 }}>{s.label}</div>
            {s.hint && <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{s.hint}</div>}
          </div>
        ))}
      </div>

      {/* Box plots */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard
          title={`HAI Titer by Timepoint — ${strain}`}
          subtitle="Distribution of log₂ titers (box = median & IQR, whiskers = 1.5×IQR)"
          minHeight={280}
        >
          {boxData.length > 0 ? (
            <BoxPlotChart data={boxData} color={color} height={280} />
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>

      {/* Scatter + arm/timepoint bars side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Scatter Day0 vs Day28 */}
        <ChartCard
          title={`Before vs After — ${strain}`}
          subtitle="Each dot = 1 participant. Dots above the dashed line gained titer by Day 28."
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
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  type="number" dataKey="day0" domain={[lo, hi]}
                  name="Day 0" tick={axisStyle} axisLine={false} tickLine={false}
                  label={{ value: 'Day 0 (baseline) log₂ titer', position: 'insideBottom', offset: -12, style: { fill: '#64748B', fontSize: 10 } }}
                />
                <YAxis
                  type="number" dataKey="day28" domain={[lo, hi]}
                  name="Day 28" tick={axisStyle} axisLine={false} tickLine={false}
                  label={{ value: 'Day 28 log₂ titer', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }}
                />
                <ReferenceLine
                  segment={[{ x: lo, y: lo }, { x: hi, y: hi }]}
                  stroke="rgba(255,255,255,0.35)" strokeDasharray="5 4" ifOverflow="extendDomain"
                />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.2)' }} />
                {armGroups.map(g => (
                  <Scatter key={g.arm} name={g.arm} data={g.data} fill={g.color} opacity={0.6}>
                    {g.data.map((_, i) => <Cell key={i} fill={g.color} />)}
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <NoData />
          )}
        </ChartCard>

        {/* Mean titer by arm & timepoint */}
        <ChartCard
          title={`Mean Titer by Vaccine Arm — ${strain}`}
          subtitle="Average log₂ titer at each timepoint, split by vaccine arm"
          minHeight={300}
        >
          <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
            {['Day 0', 'Day 28', 'Day 365'].map(tp => (
              <div key={tp} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
                <span style={{ width: 12, height: 3, background: TIMEPOINT_COLORS[tp], display: 'inline-block', borderRadius: 2 }} />
                {tp}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={armMeans} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="arm" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: 'mean log₂ titer', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="Day 0" fill={TIMEPOINT_COLORS['Day 0']} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Day 28" fill={TIMEPOINT_COLORS['Day 28']} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Day 365" fill={TIMEPOINT_COLORS['Day 365']} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
