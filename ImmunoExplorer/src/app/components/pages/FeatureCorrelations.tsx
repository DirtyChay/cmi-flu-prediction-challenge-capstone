import { useState, useMemo } from 'react';
import { ChartCard, DarkSelect } from '../ChartCard';
import { HeatmapGrid } from '../HeatmapGrid';
import {
  CORR_GROUPS, getGroupCorrelation, strainShortLabel,
} from '../../data/mockData';

export function FeatureCorrelations() {
  const [corrGroup, setCorrGroup] = useState<string>(CORR_GROUPS[0]?.value ?? '');

  const corr = useMemo(() => getGroupCorrelation(corrGroup), [corrGroup]);
  const corrShort = corr.strains.map(strainShortLabel);
  const corrGroupLabel = CORR_GROUPS.find(g => g.value === corrGroup)?.label ?? corrGroup;

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
    </div>
  );
}
