import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { User, Calendar, FlaskConical } from 'lucide-react';
import { ChartCard, DarkSelect, DarkTooltip, NoData } from '../ChartCard';
import {
  participants, getParticipantTiters, getParticipantComparison, getParticipantResponse,
  strainShortLabel,
} from '../../data/mockData';

const fmt = (v: number | null) => (v == null ? '—' : v.toFixed(2));
const MAX_OPTIONS = 300;

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
      background: '#0F1117', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)',
      padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
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

function StatCard({ value, label, tip, accent }: { value: string; label: string; tip?: string; accent?: boolean }) {
  return (
    <div title={tip} style={{
      background: '#1E2130', borderRadius: 10,
      border: accent ? '1px solid rgba(46,134,171,0.4)' : '1px solid rgba(255,255,255,0.07)',
      padding: '14px 16px', cursor: tip ? 'help' : 'default',
    }}>
      <div style={{ color: accent ? '#2E86AB' : '#E2E8F0', fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#64748B', fontSize: 11, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export function ParticipantDeepDive() {
  const [pid, setPid] = useState(participants[0]?.id ?? '');

  const participantOpts = participants.slice(0, MAX_OPTIONS).map(p => ({
    value: p.id,
    label: `${p.id} — ${p.arm}, ${p.sex}, ${p.age}y`,
  }));

  const titers = useMemo(() => getParticipantTiters(pid), [pid]);
  const comparison = useMemo(() => getParticipantComparison(pid).map(c => ({
    strain: strainShortLabel(c.strain),
    full: c.strain,
    Participant: c.participant,
    'Study median': c.studyMedian,
  })), [pid]);
  const resp = useMemo(() => getParticipantResponse(pid), [pid]);

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Participant Deep Dive</h1>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            One participant's antibody response, in context of the whole study (first {MAX_OPTIONS} participants)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Participant:</span>
          <DarkSelect value={pid} onChange={setPid} options={participantOpts} />
        </div>
      </div>

      {/* Response summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <StatCard accent
          value={`${resp.seroconverted}/${resp.withRise}`}
          label="Strains that responded (≥4×)"
          tip="Strains where this participant's antibody level rose at least 4× from Day 0 to Day 28 — the usual sign the vaccine worked — out of strains with both timepoints." />
        <StatCard
          value={(resp.medianRise >= 0 ? '+' : '') + resp.medianRise.toFixed(2)}
          label="Median fold rise (log₂)"
          tip="Typical Day 0→28 titer change for this participant. +1 = 2×, +2 = 4×." />
        <StatCard
          value={`${resp.aboveMedianD28}/${resp.withD28}`}
          label="Above study median (D28)"
          tip="Strains where this participant's Day-28 titer is higher than the median participant's." />
        <StatCard
          value={String(resp.strainsMeasured)}
          label="Strains measured" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 20 }}>
        {/* Profile card */}
        <ChartCard title="Demographics" minHeight={180}>
          <ProfileCard pid={pid} />
        </ChartCard>

        {/* Participant vs study median */}
        <ChartCard
          title="This Participant vs the Typical Participant"
          subtitle="Day-28 log₂ titer — blue = this person, grey = study median (core strains)"
          minHeight={300}
        >
          {comparison.length === 0 ? (
            <NoData />
          ) : (
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              <ResponsiveContainer width="100%" height={Math.max(260, comparison.length * 34)}>
                <BarChart data={comparison} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="strain" type="category" tick={{ fill: '#94A3B8', fontSize: 10 }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Bar dataKey="Participant" fill="#2E86AB" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="Study median" fill="#64748B" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Titer table (all measured strains) */}
      <ChartCard title="Titer Detail" subtitle="log₂ HAI values by strain, with Day 0→28 response" minHeight={200}>
        <div style={{ overflowY: 'auto', maxHeight: 380 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Strain', 'Day 0', 'Day 28', 'Day 365', 'Fold Rise', 'Responded (≥4×)'].map(h => (
                  <th key={h} style={{ padding: '7px 10px', textAlign: 'left', color: '#64748B', fontWeight: 500, position: 'sticky', top: 0, background: '#1E2130' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {titers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '14px 10px', color: '#475569' }}>No titer data for this participant.</td></tr>
              ) : titers.map((t, i) => (
                <tr key={t.strain} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 ? 'rgba(255,255,255,0.018)' : 'transparent' }}>
                  <td style={{ padding: '7px 10px', color: '#94A3B8' }}>{t.strain}</td>
                  <td style={{ padding: '7px 10px', color: '#8B5CF6', fontFamily: 'monospace' }}>{fmt(t.day0)}</td>
                  <td style={{ padding: '7px 10px', color: '#2E86AB', fontFamily: 'monospace' }}>{fmt(t.day28)}</td>
                  <td style={{ padding: '7px 10px', color: '#00D9C0', fontFamily: 'monospace' }}>{fmt(t.day365)}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace', color: t.rise == null ? '#475569' : t.rise >= 0 ? '#06D6A0' : '#EF4444' }}>
                    {t.rise == null ? '—' : (t.rise >= 0 ? '+' : '') + t.rise.toFixed(2)}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {t.seroconverted == null
                      ? <span style={{ color: '#475569' }}>—</span>
                      : t.seroconverted
                        ? <span style={{ color: '#06D6A0' }}>✓ yes</span>
                        : <span style={{ color: '#64748B' }}>no</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
