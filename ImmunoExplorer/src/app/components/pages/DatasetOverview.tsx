import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Clock, FlaskConical, Microscope,
} from 'lucide-react';
import { ChartCard, DarkTooltip } from '../ChartCard';
import {
  summaryStats, cohortCounts, ageHistogram, sexData,
  STRAIN_COUNT, timepointCoverage, groupCoverage,
  CHART_COLORS,
} from '../../data/mockData';

const ACCENT = '#2E86AB';

const SEX_COLORS = ['#2E86AB', '#F4A261'];
const ARM_COLORS = ['#2E86AB', '#00D9C0', '#F4A261', '#8B5CF6'];

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<any>; label: string; value: string | number; color: string;
}) {
  return (
    <div style={{
      background: '#1E2130',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.07)',
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 44, height: 44,
        borderRadius: 10,
        background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>{value.toLocaleString()}</div>
        <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

const axisStyle = { fill: '#64748B', fontSize: 11 };

export function DatasetOverview() {
  return (
    <div style={{ padding: '28px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Dataset Overview</h1>
        <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
          Influenza vaccine immunogenicity cohort — train_combined dataset
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Users}       label="Total Participants" value={summaryStats.participants} color="#2E86AB" />
        <StatCard icon={Microscope}  label="HAI Strains"        value={STRAIN_COUNT}             color="#00D9C0" />
        <StatCard icon={Clock}       label="Timepoints"         value={summaryStats.timepoints}  color="#F4A261" />
        <StatCard icon={FlaskConical} label="Study Cohorts"     value={summaryStats.cohorts}     color="#8B5CF6" />
      </div>

      {/* Participants per cohort */}
      <div style={{ marginBottom: 24 }}>
        <ChartCard title="Participants per Vaccine Arm" subtitle="Enrolled across study arms" minHeight={220}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={cohortCounts} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="cohort" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" name="Participants" fill={ACCENT} radius={[4, 4, 0, 0]}>
                {cohortCounts.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Demographic charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Age histogram */}
        <ChartCard title="Age Distribution" subtitle="Years at enrollment" minHeight={200}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ageHistogram} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="bin" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" name="Participants" fill="#00D9C0" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Sex donut */}
        <ChartCard title="Sex Distribution" minHeight={200}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={sexData}
                cx="50%" cy="50%"
                innerRadius={54} outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {sexData.map((_, i) => (
                  <Cell key={i} fill={SEX_COLORS[i % SEX_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div style={{
                      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
                      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
                    }}>
                      <span style={{ color: d.payload.fill }}>{d.name}</span>: {d.value}
                    </div>
                  );
                }}
              />
              <Legend
                formatter={(v) => <span style={{ color: '#94A3B8', fontSize: 11 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Assay coverage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* HAI measurements per timepoint */}
        <ChartCard title="HAI Measurements by Timepoint" subtitle="Non-empty titer values (D365 is sparser)" minHeight={200}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timepointCoverage} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="count" name="Measurements" radius={[3, 3, 0, 0]}>
                {timepointCoverage.map((_, i) => (
                  <Cell key={i} fill={['#8B5CF6', '#2E86AB', '#00D9C0'][i % 3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Strains per antigenic group */}
        <ChartCard title="Strains per Antigenic Group" subtitle="Distinct HAI strains assayed" minHeight={200}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={groupCoverage} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="group" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="strains" name="Strains" radius={[3, 3, 0, 0]}>
                {groupCoverage.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
}
