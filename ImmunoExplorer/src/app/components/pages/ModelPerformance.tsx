import { useState, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ReferenceLine,
} from 'recharts';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ChartCard, DarkSelect, DarkTooltip } from '../ChartCard';
import { TASKS, allTaskScores, getTaskPredictions } from '../../data/mockData';

const axisStyle = { fill: '#64748B', fontSize: 11 };

function spearmanRho(xs: number[], ys: number[]): number {
  const rank = (arr: number[]) => {
    const sorted = [...arr].map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(arr.length);
    sorted.forEach((item, r) => { ranks[item.i] = r + 1; });
    return ranks;
  };
  const rx = rank(xs), ry = rank(ys);
  const n = xs.length;
  const dSq = rx.reduce((sum, r, i) => sum + (r - ry[i]) ** 2, 0);
  return 1 - (6 * dSq) / (n * (n * n - 1));
}

function ScatterTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1',
    }}>
      <div style={{ color: '#94A3B8', marginBottom: 2 }}>{d?.id}</div>
      <div>Actual: <span style={{ color: '#E2E8F0' }}>{d?.actual?.toFixed(3)}</span></div>
      <div>Predicted: <span style={{ color: '#2E86AB' }}>{d?.predicted?.toFixed(3)}</span></div>
    </div>
  );
}

type SortKey = 'id' | 'actual' | 'predicted' | 'error';
type SortDir = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} style={{ color: '#475569' }} />;
  return sortDir === 'asc' ? <ChevronUp size={12} style={{ color: '#2E86AB' }} /> : <ChevronDown size={12} style={{ color: '#2E86AB' }} />;
}

export function ModelPerformance() {
  const [taskId, setTaskId] = useState(TASKS[0].id);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const predictions = useMemo(() => getTaskPredictions(taskId), [taskId]);
  const rho = useMemo(() => {
    const r = spearmanRho(predictions.map(p => p.actual), predictions.map(p => p.predicted));
    return r.toFixed(3);
  }, [predictions]);

  const allVals = useMemo(() => [...predictions.map(p => p.actual), ...predictions.map(p => p.predicted)], [predictions]);
  const valMin = useMemo(() => Math.min(...allVals) - 0.3, [allVals]);
  const valMax = useMemo(() => Math.max(...allVals) + 0.3, [allVals]);

  const refLineData = [{ x: valMin, y: valMin }, { x: valMax, y: valMax }];

  const tableData = useMemo(() => {
    const withError = predictions.map(p => ({
      ...p,
      error: +(p.predicted - p.actual).toFixed(3),
    }));
    return [...withError].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (typeof va === 'string' && typeof vb === 'string')
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [predictions, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey]);

  const taskOpts = TASKS.map(t => ({ value: t.id, label: `${t.id}: ${t.label}` }));

  const scoreColors = allTaskScores.map(t => {
    const s = t.score;
    if (s >= 0.7) return '#06D6A0';
    if (s >= 0.5) return '#2E86AB';
    if (s >= 0.3) return '#F4A261';
    return '#EF4444';
  });

  return (
    <div style={{ padding: '28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: '#E2E8F0', fontSize: 22, fontWeight: 600, margin: 0 }}>Model Performance</h1>
          <p style={{ color: '#64748B', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Spearman correlation of predicted vs. actual immunogenicity outcomes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Task:</span>
          <DarkSelect value={taskId} onChange={setTaskId} options={taskOpts} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Predicted vs actual scatter */}
        <ChartCard
          title="Predicted vs Actual"
          subtitle={`Task ${taskId}`}
          minHeight={300}
          actions={
            <div style={{
              background: 'rgba(46,134,171,0.15)',
              border: '1px solid rgba(46,134,171,0.3)',
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 13,
              color: '#2E86AB',
              fontWeight: 600,
            }}>
              ρ = {rho}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={270}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 28, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                type="number" dataKey="actual" domain={[valMin, valMax]}
                tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: 'Actual', position: 'insideBottom', offset: -14, style: { fill: '#64748B', fontSize: 10 } }}
              />
              <YAxis
                type="number" dataKey="predicted" domain={[valMin, valMax]}
                tick={axisStyle} axisLine={false} tickLine={false}
                label={{ value: 'Predicted', angle: -90, position: 'insideLeft', style: { fill: '#64748B', fontSize: 10 } }}
              />
              <Tooltip content={<ScatterTooltip />} />
              {/* Diagonal reference line */}
              <Scatter
                name="Reference"
                data={refLineData}
                line={{ stroke: 'rgba(255,255,255,0.2)', strokeDasharray: '5 4', strokeWidth: 1.5 }}
                fill="transparent"
                shape={() => null as any}
              />
              {/* Actual predictions */}
              <Scatter
                name="Predictions"
                data={predictions}
                fill="#2E86AB"
                opacity={0.75}
              >
                {predictions.map((_, i) => (
                  <Cell key={i} fill="#2E86AB" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Bar chart: all task scores */}
        <ChartCard title="Spearman ρ Across All Tasks" subtitle="Higher = better prediction" minHeight={300}>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart
              data={allTaskScores}
              layout="vertical"
              margin={{ top: 4, right: 40, left: 70, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, 1]} tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis dataKey="task" type="category" tick={axisStyle} axisLine={false} tickLine={false} width={66} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0];
                  return (
                    <div style={{ background: '#1E2130', border: '1px solid rgba(46,134,171,0.35)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#CBD5E1' }}>
                      <div style={{ fontWeight: 600, marginBottom: 3 }}>{d.payload.label}</div>
                      <div>ρ = <span style={{ color: '#2E86AB' }}>{(d.value as number)?.toFixed(3)}</span></div>
                    </div>
                  );
                }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="score" name="Spearman ρ" radius={[0, 3, 3, 0]}>
                {allTaskScores.map((_, i) => (
                  <Cell key={i} fill={scoreColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Sortable table */}
      <ChartCard title={`Per-Participant Predictions — Task ${taskId}`} subtitle="Click column headers to sort" minHeight={280}>
        <div style={{ overflowY: 'auto', maxHeight: 340 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {[
                  { key: 'id' as SortKey, label: 'Participant' },
                  { key: 'actual' as SortKey, label: 'Actual' },
                  { key: 'predicted' as SortKey, label: 'Predicted' },
                  { key: 'error' as SortKey, label: 'Error' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => toggleSort(key)}
                    style={{
                      padding: '8px 10px',
                      textAlign: 'left',
                      color: sortKey === key ? '#2E86AB' : '#64748B',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontWeight: 500,
                      position: 'sticky', top: 0,
                      background: '#1E2130',
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {label}
                      <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, i) => {
                const err = row.error;
                const errColor = Math.abs(err) < 0.5 ? '#06D6A0' : Math.abs(err) < 1 ? '#F4A261' : '#EF4444';
                return (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(46,134,171,0.07)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)')}
                  >
                    <td style={{ padding: '7px 10px', color: '#94A3B8' }}>{row.id}</td>
                    <td style={{ padding: '7px 10px', color: '#CBD5E1', fontFamily: 'monospace' }}>{row.actual.toFixed(3)}</td>
                    <td style={{ padding: '7px 10px', color: '#2E86AB', fontFamily: 'monospace' }}>{row.predicted.toFixed(3)}</td>
                    <td style={{ padding: '7px 10px', color: errColor, fontFamily: 'monospace' }}>
                      {err > 0 ? '+' : ''}{err.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
