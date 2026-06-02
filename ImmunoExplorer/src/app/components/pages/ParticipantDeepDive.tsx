import { useState, useMemo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ReferenceLine,
} from 'recharts';
import { User, Calendar, FlaskConical } from 'lucide-react';
import { ChartCard, DarkSelect, NoData } from '../ChartCard';
import {
  participants, getParticipantTiters, CORE_STRAINS, strainGroup,
} from '../../data/mockData';

const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(2));

function ProfileCard({ pid }: { pid: string }) {
  const p = participants.find(px => px.id === pid);
  if (!p) return <NoData />;

  const fields = [
    { icon: User, label: 'Participant ID', value: p.id },
    { icon: Calendar, label: 'Age', value: `${p.age} yrs` },
    { icon: User, label: 'Sex', value: p.sex },
    { icon: FlaskConical, label: 'Vaccine Arm', value: p.arm },
  ];

  return (
    <div style={{
      background: '#0F1117',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '16px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
    }}>
      {fields.map(f => (
        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</span>
          <span style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 500 }}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}

// Short strain label for the radar axes (drop the group prefix to save space)
function shortStrain(strain: string) {
  return strain.replace(/^\S+\s/, '');
}

function TiterRadar({ pid }: { pid: string }) {
  const titers = getParticipantTiters(pid).filter(t => CORE_STRAINS.includes(t.strain));

  if (!titers.length) return <NoData />;

  const radarData = titers.map(t => ({
    strain: shortStrain(t.strain),
    'Day 0': t.day0,
    'Day 28': t.day28,
    'Day 365': t.day365,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            <span style={{ color: '#94A3B8' }}>{p.name}:</span>
            <span style={{ color: '#E2E8F0' }}>{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.1)" />
        <PolarAngleAxis
          dataKey="strain"
          tick={{ fill: '#94A3B8', fontSize: 9 }}
        />
        <PolarRadiusAxis
          tick={{ fill: '#475569', fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Radar name="Day 0" dataKey="Day 0" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.12} strokeWidth={1.5} dot />
        <Radar name="Day 28" dataKey="Day 28" stroke="#2E86AB" fill="#2E86AB" fillOpacity={0.2} strokeWidth={2} dot />
        <Radar name="Day 365" dataKey="Day 365" stroke="#00D9C0" fill="#00D9C0" fillOpacity={0.12} strokeWidth={1.5} dot />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94A3B8' }}>
      <span style={{ width: 20, height: 2.5, background: color, display: 'inline-block', borderRadius: 2 }} />
      {label}
    </div>
  );
}

// Cap the participant dropdown — a native <select> with all 3,757 IDs is sluggish.
const MAX_OPTIONS = 300;

export function ParticipantDeepDive() {
  const [pid, setPid] = useState(participants[0]?.id ?? '');

  const participantOpts = participants.slice(0, MAX_OPTIONS).map(p => ({
    value: p.id,
    label: `${p.id} — ${p.arm}, ${p.sex}, ${p.age}y`,
  }));

  const titers = useMemo(() => getParticipantTiters(pid), [pid]);

  const foldRise = useMemo(() =>
    titers
      .filter(t => t.day0 != null && t.day28 != null)
      .map(t => ({ strain: shortStrain(t.strain), rise: +((t.day28 as number) - (t.day0 as number)).toFixed(2) })),
    [titers]);

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Participant Deep Dive</h1>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Individual-level immunological profile (first {MAX_OPTIONS} participants)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Participant:</span>
          <DarkSelect value={pid} onChange={setPid} options={participantOpts} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 20 }}>
        {/* Profile card */}
        <ChartCard title="Demographics" minHeight={180}>
          <ProfileCard pid={pid} />
        </ChartCard>

        {/* Radar chart */}
        <ChartCard title="HAI Titer Radar" subtitle="log₂ titers — core strains across timepoints" minHeight={300}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 8 }}>
            <LegendItem color="#8B5CF6" label="Day 0" />
            <LegendItem color="#2E86AB" label="Day 28" />
            <LegendItem color="#00D9C0" label="Day 365" />
          </div>
          <TiterRadar pid={pid} />
        </ChartCard>
      </div>

      {/* Fold rise per strain */}
      <div style={{ marginBottom: 20 }}>
        <ChartCard title="Fold Rise by Strain" subtitle="Day 0 → Day 28 change in log₂ HAI titer" minHeight={220}>
          {foldRise.length === 0 ? (
            <NoData />
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <ResponsiveContainer width="100%" height={Math.max(200, foldRise.length * 22)}>
              <BarChart data={foldRise} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="strain" type="category" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={150} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const v = payload[0].value as number;
                    return (
                      <div style={{ background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1' }}>
                        <div style={{ color: '#94A3B8', marginBottom: 2 }}>{payload[0].payload.strain}</div>
                        Δ log₂: <span style={{ color: v >= 0 ? '#06D6A0' : '#EF4444' }}>{v >= 0 ? '+' : ''}{v.toFixed(2)}</span>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.2)" />
                <Bar dataKey="rise" name="Fold rise" radius={[0, 3, 3, 0]}>
                  {foldRise.map((d, i) => (
                    <Cell key={i} fill={d.rise >= 0 ? '#06D6A0' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Titer table (all measured strains) */}
      <ChartCard title="Titer Summary" subtitle="log₂ HAI values by strain — all measured strains" minHeight={200}>
        <div style={{ overflowY: 'auto', maxHeight: 360 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Strain', 'Day 0', 'Day 28', 'Day 365'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B', fontWeight: 500, position: 'sticky', top: 0, background: '#1E2130' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {titers.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '14px 10px', color: '#475569' }}>No titer data for this participant.</td></tr>
              ) : titers.map((t, i) => (
                <tr key={t.strain} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 ? 'rgba(255,255,255,0.018)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: '#94A3B8' }} title={strainGroup(t.strain)}>{t.strain}</td>
                  <td style={{ padding: '7px 10px', color: '#8B5CF6', fontFamily: 'monospace' }}>{fmt(t.day0)}</td>
                  <td style={{ padding: '7px 10px', color: '#2E86AB', fontFamily: 'monospace' }}>{fmt(t.day28)}</td>
                  <td style={{ padding: '7px 10px', color: '#00D9C0', fontFamily: 'monospace' }}>{fmt(t.day365)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
