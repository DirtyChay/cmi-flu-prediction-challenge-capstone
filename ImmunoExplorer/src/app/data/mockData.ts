// Real data layer for ImmunoExplorer.
//
// Despite the file name (kept so existing imports don't churn), this module no
// longer generates synthetic data — it loads the preprocessed real cohort from
// realData.json, which is built from cleaned_data/train_combined.csv by
// scripts/build-data.mjs (run `npm run build:data` to regenerate).
import realData from './realData.json';

// ── Raw types from realData.json ────────────────────────────────────────────
interface RawData {
  meta: {
    strains: string[];
    strainGroups: string[];
    coreStrains: number[];
    arms: string[];
    generatedFrom: string;
  };
  participants: { id: string; sex: string; age: number | null; arm: string }[];
  // [participantIndex, strainIndex, d0, d28, d365]
  titers: [number, number, number | null, number | null, number | null][];
}

const data = realData as unknown as RawData;

// ── Strains & groups ────────────────────────────────────────────────────────
export const STRAINS = data.meta.strains;
export const CORE_STRAINS = data.meta.coreStrains.map(i => STRAINS[i]);
export const CORR_STRAINS = CORE_STRAINS;

const strainIndex = new Map(STRAINS.map((s, i) => [s, i]));
export function strainGroup(strain: string): string {
  return strain.split(' ')[0];
}

// Compact label, e.g. "H1N1 A/California/7/2009" -> "California '09".
export function strainShortLabel(strain: string): string {
  const rest = strain.split(' ').slice(1).join(' '); // drop subtype prefix
  const segs = rest.split('/');
  const location = segs[1] ?? rest;
  const year = segs[segs.length - 1] ?? '';
  const yy = /^\d{4}$/.test(year) ? `'${year.slice(2)}` : year;
  return yy ? `${location} ${yy}` : location;
}

const GROUP_COLORS: Record<string, string> = {
  H1N1: '#2E86AB', H3N2: '#00D9C0', Vic: '#F4A261', Yam: '#8B5CF6', Anc: '#06D6A0',
};
export function strainColor(strain: string): string {
  return GROUP_COLORS[strainGroup(strain)] ?? '#2E86AB';
}

export const CHART_COLORS = ['#2E86AB', '#00D9C0', '#F4A261', '#E76F51', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444'];

// ── Vaccine arms ────────────────────────────────────────────────────────────
export const VACCINE_ARMS = data.meta.arms;
export const ARM_COLORS: Record<string, string> = {};
VACCINE_ARMS.forEach((arm, i) => { ARM_COLORS[arm] = CHART_COLORS[i % CHART_COLORS.length]; });

// ── Participants ────────────────────────────────────────────────────────────
export interface Participant {
  id: string;
  age: number;
  sex: 'Male' | 'Female' | 'Unknown';
  arm: string;
}

export const participants: Participant[] = data.participants.map(p => ({
  id: p.id,
  age: p.age ?? 0,
  sex: (p.sex as Participant['sex']) ?? 'Unknown',
  arm: p.arm,
}));

// ── Titer lookups ───────────────────────────────────────────────────────────
interface TiterRec { d0: number | null; d28: number | null; d365: number | null }

// strainIndex -> array of { pIdx, d0, d28, d365 }
const byStrain = new Map<number, { pIdx: number; d0: number | null; d28: number | null; d365: number | null }[]>();
// participant id -> (strainIndex -> TiterRec)
const byParticipant = new Map<string, Map<number, TiterRec>>();

for (const [pIdx, sIdx, d0, d28, d365] of data.titers) {
  if (!byStrain.has(sIdx)) byStrain.set(sIdx, []);
  byStrain.get(sIdx)!.push({ pIdx, d0, d28, d365 });

  const pid = data.participants[pIdx].id;
  if (!byParticipant.has(pid)) byParticipant.set(pid, new Map());
  byParticipant.get(pid)!.set(sIdx, { d0, d28, d365 });
}

// ── Summary / demographics ──────────────────────────────────────────────────
export const summaryStats = {
  participants: participants.length,
  timepoints: 3, // Day 0, Day 28, Day 365 (HAI _d0/_d28/_d365)
  cohorts: VACCINE_ARMS.length,
};

// Participants per vaccine arm (the study's cohorts)
export const cohortCounts = VACCINE_ARMS.map(arm => ({
  cohort: arm,
  count: participants.filter(p => p.arm === arm).length,
}));

const ageBins = ['18–25', '26–35', '36–45', '46–55', '56–65', '66+'];
const ageBinEdges = [18, 26, 36, 46, 56, 66, 200];
export const ageHistogram = ageBins.map((bin, i) => ({
  bin,
  count: participants.filter(p => p.age >= ageBinEdges[i] && p.age < ageBinEdges[i + 1]).length,
}));

export const sexData = [
  { name: 'Male', value: participants.filter(p => p.sex === 'Male').length },
  { name: 'Female', value: participants.filter(p => p.sex === 'Female').length },
];

export const vaccineArmData = VACCINE_ARMS.map(arm => ({
  arm,
  value: participants.filter(p => p.arm === arm).length,
}));

// ── Box-plot stats ──────────────────────────────────────────────────────────
export interface BoxStats {
  label: string;
  whiskerLow: number;
  q1: number;
  median: number;
  q3: number;
  whiskerHigh: number;
}

function computeBoxStats(label: string, values: number[]): BoxStats | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  const q1 = s[Math.floor(n * 0.25)];
  const median = s[Math.floor(n * 0.5)];
  const q3 = s[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  return {
    label,
    q1, median, q3,
    whiskerLow: Math.max(s[0], q1 - 1.5 * iqr),
    whiskerHigh: Math.min(s[n - 1], q3 + 1.5 * iqr),
  };
}

export function getBoxPlotData(strain: string): BoxStats[] {
  const sIdx = strainIndex.get(strain);
  const recs = sIdx === undefined ? [] : (byStrain.get(sIdx) ?? []);
  const col = (key: 'd0' | 'd28' | 'd365') =>
    recs.map(r => r[key]).filter((v): v is number => v != null);
  return [
    computeBoxStats('Day 0', col('d0')),
    computeBoxStats('Day 28', col('d28')),
    computeBoxStats('Day 365', col('d365')),
  ].filter((b): b is BoxStats => b != null);
}

export function getHAIScatterData(strain: string) {
  const sIdx = strainIndex.get(strain);
  const recs = sIdx === undefined ? [] : (byStrain.get(sIdx) ?? []);
  return recs
    .filter(r => r.d0 != null && r.d28 != null)
    .map(r => ({
      day0: r.d0 as number,
      day28: r.d28 as number,
      arm: participants[r.pIdx].arm,
    }));
}

// ── Coverage / antigenic groups ─────────────────────────────────────────────
function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const STRAIN_COUNT = STRAINS.length;

const GROUP_ORDER = ['H1N1', 'H3N2', 'Vic', 'Yam', 'Anc'];
const GROUP_LABEL: Record<string, string> = {
  H1N1: 'H1N1', H3N2: 'H3N2', Vic: 'B/Victoria', Yam: 'B/Yamagata', Anc: 'Ancestral B',
};

// Non-null HAI measurements at each timepoint (data completeness).
export const timepointCoverage = (() => {
  let d0 = 0, d28 = 0, d365 = 0;
  for (const recs of byStrain.values()) {
    for (const r of recs) {
      if (r.d0 != null) d0++;
      if (r.d28 != null) d28++;
      if (r.d365 != null) d365++;
    }
  }
  return [
    { day: 'Day 0', count: d0 },
    { day: 'Day 28', count: d28 },
    { day: 'Day 365', count: d365 },
  ];
})();

// Strains + total measurements per antigenic group.
export const groupCoverage = GROUP_ORDER.map(g => {
  let strains = 0, measurements = 0;
  STRAINS.forEach((s, sIdx) => {
    if (strainGroup(s) !== g) return;
    strains++;
    for (const r of byStrain.get(sIdx) ?? []) {
      measurements += (r.d0 != null ? 1 : 0) + (r.d28 != null ? 1 : 0) + (r.d365 != null ? 1 : 0);
    }
  });
  return { group: GROUP_LABEL[g], strains, measurements };
}).filter(r => r.strains > 0);

// Mean Day-0 → Day-28 fold rise (log₂) per antigenic group × vaccine arm.
export const foldRiseByArm = GROUP_ORDER.map(g => {
  const row: Record<string, number | string> = { group: GROUP_LABEL[g] };
  let total = 0;
  VACCINE_ARMS.forEach(arm => {
    const rises: number[] = [];
    STRAINS.forEach((s, sIdx) => {
      if (strainGroup(s) !== g) return;
      for (const r of byStrain.get(sIdx) ?? []) {
        if (r.d0 != null && r.d28 != null && participants[r.pIdx].arm === arm) {
          rises.push(r.d28 - r.d0);
        }
      }
    });
    total += rises.length;
    row[arm] = rises.length ? +(rises.reduce((a, b) => a + b, 0) / rises.length).toFixed(2) : 0;
  });
  return total ? row : null;
}).filter((r): r is Record<string, number | string> => r != null);

// Per-strain Day-28 coverage (measured vs missing), sorted by most-missing first.
export const strainD28Coverage = STRAINS.map((s, sIdx) => {
  const recs = byStrain.get(sIdx) ?? [];
  const measured = recs.filter(r => r.d28 != null).length;
  return { strain: s, measured, missing: participants.length - measured };
}).sort((a, b) => b.missing - a.missing);

// Per-strain summary used by the HAI Explorer header strip.
export function getStrainSummary(strain: string) {
  const sIdx = strainIndex.get(strain);
  const recs = sIdx === undefined ? [] : (byStrain.get(sIdx) ?? []);
  const d0 = recs.map(r => r.d0).filter((v): v is number => v != null);
  const d28 = recs.map(r => r.d28).filter((v): v is number => v != null);
  const rises = recs.filter(r => r.d0 != null && r.d28 != null).map(r => (r.d28 as number) - (r.d0 as number));
  // Each rec is one participant that has at least one timepoint for this strain.
  const nParticipants = recs.length;
  return {
    nD0: d0.length,
    nD28: d28.length,
    nParticipants,
    total: participants.length,
    coveragePct: participants.length ? +(100 * nParticipants / participants.length).toFixed(1) : 0,
    medianD0: +median(d0).toFixed(2),
    medianD28: +median(d28).toFixed(2),
    medianRise: +median(rises).toFixed(2),
  };
}

// Mean titer per vaccine arm at each timepoint, for a single strain.
// Shaped for a grouped bar chart: [{ arm, 'Day 0', 'Day 28', 'Day 365' }, ...]
export function getArmTimepointMeans(strain: string) {
  const sIdx = strainIndex.get(strain);
  const recs = sIdx === undefined ? [] : (byStrain.get(sIdx) ?? []);
  const mean = (vals: number[]) => vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0;
  return VACCINE_ARMS.map(arm => {
    const armRecs = recs.filter(r => participants[r.pIdx].arm === arm);
    return {
      arm,
      'Day 0': mean(armRecs.map(r => r.d0).filter((v): v is number => v != null)),
      'Day 28': mean(armRecs.map(r => r.d28).filter((v): v is number => v != null)),
      'Day 365': mean(armRecs.map(r => r.d365).filter((v): v is number => v != null)),
    };
  });
}

// Mean Day-28 titer per strain × vaccine arm (heatmap). Rows = all strains.
export const haiHeatmap = STRAINS.map((strain, sIdx) => {
  const recs = byStrain.get(sIdx) ?? [];
  return {
    strain,
    values: VACCINE_ARMS.map(arm => {
      const vals = recs
        .filter(r => r.d28 != null && participants[r.pIdx].arm === arm)
        .map(r => r.d28 as number);
      return { arm, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
    }),
  };
});

// ── Correlations (core strains, Day-0 log₂ titers) ──────────────────────────
function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / n;
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) / n);
  const sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0) / n);
  return sx && sy ? cov / (sx * sy) : 0;
}

// participant id -> Day-0 value for a strain (used to align pairs)
function day0Map(strain: string): Map<string, number> {
  const m = new Map<string, number>();
  const sIdx = strainIndex.get(strain);
  if (sIdx === undefined) return m;
  for (const r of byStrain.get(sIdx) ?? []) {
    if (r.d0 != null) m.set(participants[r.pIdx].id, r.d0);
  }
  return m;
}

function strainYear(s: string): number {
  const segs = s.split('/');
  const y = segs[segs.length - 1];
  return /^\d{4}$/.test(y) ? +y : 0;
}

// Antigenic groups available for the correlation view (only those with strains).
export const CORR_GROUPS = GROUP_ORDER
  .filter(g => STRAINS.some(s => strainGroup(s) === g))
  .map(g => ({ value: g, label: GROUP_LABEL[g] }));

// Day-0 titer correlation among strains WITHIN one antigenic group.
// Keeps the best-measured strains (so r is meaningful) and orders them
// chronologically so antigenic drift reads left→right / top→bottom.
export function getGroupCorrelation(group: string, minD0 = 50, maxStrains = 20) {
  const strains = STRAINS
    .filter(s => strainGroup(s) === group)
    .map(s => ({ s, n: (byStrain.get(strainIndex.get(s)!) ?? []).filter(r => r.d0 != null).length }))
    .filter(x => x.n >= minD0)
    .sort((a, b) => b.n - a.n)
    .slice(0, maxStrains)
    .map(x => x.s)
    .sort((a, b) => strainYear(a) - strainYear(b));

  const maps = strains.map(day0Map);
  const matrix = strains.map((_, i) =>
    strains.map((_, j) => {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [pid, v1] of maps[i]) {
        const v2 = maps[j].get(pid);
        if (v2 != null) { xs.push(v1); ys.push(v2); }
      }
      return +pearson(xs, ys).toFixed(3);
    })
  );
  return { strains, matrix };
}

// ── Scatter explorer ────────────────────────────────────────────────────────
// Fields: "Age" plus "<strain> D0" / "<strain> D28" for each core strain.
export type ScatterField = string;
export const SCATTER_FIELDS: ScatterField[] = [
  'Age',
  ...CORE_STRAINS.flatMap(s => [`${s} D0`, `${s} D28`]),
];

function fieldValue(pid: string, field: ScatterField): number | null {
  if (field === 'Age') {
    const p = participants.find(px => px.id === pid);
    return p ? p.age : null;
  }
  const isD28 = field.endsWith(' D28');
  const strain = field.replace(/ D(0|28)$/, '');
  const sIdx = strainIndex.get(strain);
  if (sIdx === undefined) return null;
  const rec = byParticipant.get(pid)?.get(sIdx);
  if (!rec) return null;
  return isD28 ? rec.d28 : rec.d0;
}

export function getScatterData(xField: ScatterField, yField: ScatterField, colorBy: 'arm' | 'sex') {
  return participants.map(p => {
    const x = fieldValue(p.id, xField);
    const y = fieldValue(p.id, yField);
    if (x == null || y == null) return null;
    const group = colorBy === 'arm' ? p.arm : p.sex;
    return { x: +x.toFixed(3), y: +y.toFixed(3), group, pid: p.id };
  }).filter(Boolean) as { x: number; y: number; group: string; pid: string }[];
}

// ── Chat context data ────────────────────────────────────────────────────────

// Q1: biggest antibody boost — median log2 rise (D28-D0) per strain, ≥20 pairs
export const strainBoost = STRAINS.map((strain, sIdx) => {
  const pairs = (byStrain.get(sIdx) ?? []).filter(r => r.d0 != null && r.d28 != null);
  const rises = pairs.map(r => (r.d28 as number) - (r.d0 as number));
  return { strain, medianRise: rises.length >= 20 ? +median(rises).toFixed(2) : null, n: pairs.length };
}).filter(s => s.medianRise !== null).sort((a, b) => (b.medianRise ?? 0) - (a.medianRise ?? 0));

// Q2: male vs female mean log2 rise across all strains
export const sexResponse = (['Male', 'Female'] as const).map(sex => {
  const rises: number[] = [];
  for (const recs of byStrain.values())
    for (const r of recs)
      if (r.d0 != null && r.d28 != null && participants[r.pIdx].sex === sex)
        rises.push(r.d28 - r.d0);
  return { sex, meanRise: rises.length ? +(rises.reduce((a, b) => a + b, 0) / rises.length).toFixed(2) : 0 };
});

// Q4: median D0 baseline titer by age group across all strains
const AGE_BRACKETS = [{ label: '18–35', lo: 18, hi: 36 }, { label: '36–55', lo: 36, hi: 56 }, { label: '56+', lo: 56, hi: 200 }];
export const ageBaseline = AGE_BRACKETS.map(({ label, lo, hi }) => {
  const vals: number[] = [];
  for (const recs of byStrain.values())
    for (const r of recs) {
      const age = participants[r.pIdx].age;
      if (r.d0 != null && age >= lo && age < hi) vals.push(r.d0);
    }
  return { age: label, medianD0: vals.length ? +median(vals).toFixed(2) : null };
});

// ── Participant deep-dive ───────────────────────────────────────────────────
export function getParticipantTiters(pid: string) {
  const recs = byParticipant.get(pid);
  if (!recs) return [];
  return [...recs.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sIdx, t]) => ({
      strain: STRAINS[sIdx],
      day0: t.d0,
      day28: t.d28,
      day365: t.d365,
    }));
}
