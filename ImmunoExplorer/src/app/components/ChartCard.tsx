import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  minHeight?: number;
}

export function ChartCard({ title, subtitle, children, actions, minHeight }: ChartCardProps) {
  return (
    <div style={{
      background: '#1E2130',
      borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.07)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 500 }}>{title}</div>
          {subtitle && <div style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div style={{ padding: '16px 18px', minHeight: minHeight ?? 220 }}>
        {children}
      </div>
    </div>
  );
}

export function DarkSelect({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: '#0F1117',
        color: '#CBD5E1',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '5px 10px',
        fontSize: 12,
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function DarkTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1E2130',
      border: '1px solid rgba(46,134,171,0.35)',
      borderRadius: 8,
      padding: '8px 12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
      fontSize: 12,
      fontFamily: 'Inter, sans-serif',
    }}>
      {label !== undefined && label !== '' && (
        <div style={{ color: '#94A3B8', marginBottom: 4 }}>{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || '#2E86AB', flexShrink: 0 }} />
          <span style={{ color: '#94A3B8' }}>{p.name}:</span>
          <span style={{ color: '#E2E8F0', fontWeight: 500 }}>
            {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NoData() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 120, color: '#475569', fontSize: 13,
      border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8,
    }}>
      No data available
    </div>
  );
}
