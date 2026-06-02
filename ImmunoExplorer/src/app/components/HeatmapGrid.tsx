import { useState } from 'react';

interface HeatmapGridProps {
  rowLabels: string[];
  colLabels: string[];
  values: number[][];
  colorMin?: string;
  colorMax?: string;
  diverging?: boolean;
  formatVal?: (v: number) => string;
  // Optional full-text labels shown on hover (default to the short labels).
  rowTitles?: string[];
  colTitles?: string[];
  rotateColLabels?: boolean;
  cellMinWidth?: number;
  cellHeight?: number;
  rowLabelWidth?: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function interpolateHex(hex1: string, hex2: string, t: number) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  return `rgb(${Math.round(lerp(c1.r, c2.r, t))},${Math.round(lerp(c1.g, c2.g, t))},${Math.round(lerp(c1.b, c2.b, t))})`;
}

export function HeatmapGrid({
  rowLabels, colLabels, values,
  colorMin = '#0F1117', colorMax = '#2E86AB',
  diverging = false,
  formatVal = (v: number) => v.toFixed(2),
  rowTitles, colTitles,
  rotateColLabels = false,
  cellMinWidth = 58,
  cellHeight = 36,
  rowLabelWidth = 96,
}: HeatmapGridProps) {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

  const flat = values.flat();
  const minVal = Math.min(...flat);
  const maxVal = Math.max(...flat);

  const rowTitleAt = (i: number) => rowTitles?.[i] ?? rowLabels[i];
  const colTitleAt = (i: number) => colTitles?.[i] ?? colLabels[i];

  const cellColor = (v: number): string => {
    if (diverging) {
      if (v < 0) return interpolateHex('#EF4444', '#1E2130', v + 1);
      return interpolateHex('#1E2130', '#2E86AB', v);
    }
    const t = maxVal > minVal ? (v - minVal) / (maxVal - minVal) : 0;
    return interpolateHex(colorMin, colorMax, t);
  };

  const textColor = (v: number): string => {
    const t = diverging
      ? Math.abs(v)
      : maxVal > minVal ? (v - minVal) / (maxVal - minVal) : 0;
    return t > 0.45 ? 'rgba(255,255,255,0.9)' : '#94A3B8';
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-block', minWidth: '100%' }}>
        {/* Header row */}
        <div style={{ display: 'flex', paddingLeft: rowLabelWidth, alignItems: 'flex-end', height: rotateColLabels ? 84 : undefined }}>
          {colLabels.map((c, ci) => (
            <div key={ci} title={colTitleAt(ci)} style={{
              flex: 1, minWidth: cellMinWidth,
              color: '#94A3B8', fontSize: 10, padding: rotateColLabels ? 0 : '4px 2px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              height: rotateColLabels ? 84 : undefined,
            }}>
              <span style={rotateColLabels ? {
                transform: 'rotate(-55deg)',
                transformOrigin: 'bottom center',
                whiteSpace: 'nowrap',
                display: 'inline-block',
              } : {
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center', width: '100%',
              }}>
                {c}
              </span>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {rowLabels.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
            <div title={rowTitleAt(ri)} style={{
              width: rowLabelWidth, fontSize: 11, color: '#94A3B8', textAlign: 'right',
              paddingRight: 10, flexShrink: 0, whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {row}
            </div>
            {colLabels.map((col, ci) => {
              const v = values[ri]?.[ci] ?? 0;
              const isHov = hovered?.r === ri && hovered?.c === ci;
              return (
                <div
                  key={ci}
                  style={{
                    flex: 1, minWidth: cellMinWidth, height: cellHeight,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: cellColor(v),
                    borderRadius: 4,
                    margin: '0 2px',
                    cursor: 'default',
                    fontSize: 10,
                    color: textColor(v),
                    fontWeight: 500,
                    border: isHov ? '1px solid rgba(255,255,255,0.4)' : '1px solid transparent',
                    transition: 'border 0.1s',
                  }}
                  onMouseEnter={() => setHovered({ r: ri, c: ci })}
                  onMouseLeave={() => setHovered(null)}
                  title={`${rowTitleAt(ri)} × ${colTitleAt(ci)}: ${formatVal(v)}`}
                >
                  {formatVal(v)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
