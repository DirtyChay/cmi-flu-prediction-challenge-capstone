import { useRef, useState, useEffect } from 'react';
import { BoxStats } from '../data/mockData';

interface BoxPlotChartProps {
  data: BoxStats[];
  color?: string;
  yLabel?: string;
  height?: number;
}

interface BoxPlotInnerProps extends BoxPlotChartProps {
  width: number;
}

function BoxPlotInner({ data, width, color = '#2E86AB', yLabel = 'log₂ HAI Titer', height = 280 }: BoxPlotInnerProps) {
  const margin = { top: 20, right: 20, bottom: 42, left: 56 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const allVals = data.flatMap(d => [d.whiskerLow, d.whiskerHigh]);
  if (!allVals.length) return null;
  const yMin = Math.min(...allVals) - 0.6;
  const yMax = Math.max(...allVals) + 0.6;

  const scaleY = (v: number) => innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const numTicks = 6;
  const yTicks = Array.from({ length: numTicks }, (_, i) => yMin + (i / (numTicks - 1)) * (yMax - yMin));
  const xStep = innerW / data.length;
  const boxW = Math.min(50, xStep * 0.45);

  const [tooltip, setTooltip] = useState<{ x: number; y: number; d: BoxStats } | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Grid + Y axis ticks */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={0} y1={scaleY(t)} x2={innerW} y2={scaleY(t)} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
              <text x={-8} y={scaleY(t)} fill="#64748B" fontSize={10} textAnchor="end" dominantBaseline="middle">
                {t.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axes */}
          <line x1={0} y1={0} x2={0} y2={innerH} stroke="rgba(255,255,255,0.1)" />
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke="rgba(255,255,255,0.1)" />

          {/* Y label */}
          <text
            transform={`rotate(-90) translate(${-innerH / 2},${-42})`}
            fill="#64748B" fontSize={10} textAnchor="middle"
          >
            {yLabel}
          </text>

          {/* Boxes */}
          {data.map((d, i) => {
            const cx = (i + 0.5) * xStep;
            const q1y = scaleY(d.q1);
            const q3y = scaleY(d.q3);
            const medy = scaleY(d.median);
            const wly = scaleY(d.whiskerLow);
            const why = scaleY(d.whiskerHigh);
            const capHalf = boxW * 0.35;

            return (
              <g
                key={i}
                style={{ cursor: 'pointer' }}
                onMouseEnter={e => setTooltip({ x: cx + margin.left, y: medy + margin.top, d })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Lower whisker */}
                <line x1={cx} y1={q1y} x2={cx} y2={wly} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
                <line x1={cx - capHalf} y1={wly} x2={cx + capHalf} y2={wly} stroke={color} strokeWidth={1.5} />

                {/* IQR box */}
                <rect
                  x={cx - boxW / 2} y={q3y}
                  width={boxW} height={Math.max(1, q1y - q3y)}
                  fill={`${color}28`} stroke={color} strokeWidth={1.5} rx={3}
                />

                {/* Upper whisker */}
                <line x1={cx} y1={q3y} x2={cx} y2={why} stroke={color} strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
                <line x1={cx - capHalf} y1={why} x2={cx + capHalf} y2={why} stroke={color} strokeWidth={1.5} />

                {/* Median */}
                <line x1={cx - boxW / 2} y1={medy} x2={cx + boxW / 2} y2={medy} stroke={color} strokeWidth={2.5} />

                {/* Median dot */}
                <circle cx={cx} cy={medy} r={3} fill={color} />

                {/* X label */}
                <text x={cx} y={innerH + 22} fill="#94A3B8" fontSize={11} textAnchor="middle">{d.label}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x + 12,
          top: tooltip.y - 60,
          background: '#1E2130',
          border: '1px solid rgba(46,134,171,0.4)',
          borderRadius: 8,
          padding: '8px 12px',
          fontSize: 11,
          color: '#CBD5E1',
          pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 10,
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: '#2E86AB' }}>{tooltip.d.label}</div>
          <div>Median: <span style={{ color: '#E2E8F0' }}>{tooltip.d.median.toFixed(2)}</span></div>
          <div>IQR: <span style={{ color: '#E2E8F0' }}>{tooltip.d.q1.toFixed(2)} – {tooltip.d.q3.toFixed(2)}</span></div>
          <div>Whiskers: <span style={{ color: '#E2E8F0' }}>{tooltip.d.whiskerLow.toFixed(2)} – {tooltip.d.whiskerHigh.toFixed(2)}</span></div>
        </div>
      )}
    </div>
  );
}

export function BoxPlotChart({ data, color, yLabel, height = 280 }: BoxPlotChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) setWidth(entry.contentRect.width);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {data.length > 0 ? (
        <BoxPlotInner data={data} width={width} color={color} yLabel={yLabel} height={height} />
      ) : (
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
          No data
        </div>
      )}
    </div>
  );
}
