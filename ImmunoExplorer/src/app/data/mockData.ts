// Seeded PRNG for reproducible data
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function boxMuller(r: () => number) {
  let u1 = 0, u2 = 0;
  while (u1 < 1e-10) u1 = r();
  while (u2 < 1e-10) u2 = r();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const rng = seededRng(42);
const rn = () => boxMuller(rng);

export const STRAINS = ['H1N1', 'H3N2', 'B/Victoria', 'B/Yamagata'] as const;
export const COHORTS = ['High-Dose TIV', 'Standard TIV', 'LAIV', 'Placebo'] as const;
export const VACCINE_ARMS = ['TIV-HD', 'TIV-SD', 'LAIV', 'Placebo'] as const;
export const RACES = ['White', 'Black/AA', 'Hispanic', 'Asian', 'Other'] as const;
export const TIMEPOINTS = ['Day 0', 'Day 28', 'Day 365'] as const;

export const CHART_COLORS = ['#2E86AB', '#00D9C0', '#F4A261', '#E76F51', '#8B5CF6', '#06D6A0', '#F59E0B', '#EF4444'];
export const ARM_COLORS: Record<string, string> = {
  'TIV-HD': '#2E86AB',
  'TIV-SD': '#00D9C0',
  'LAIV': '#F4A261',
  'Placebo': '#8B5CF6',
};

export interface Participant {
  id: string;
  age: number;
  sex: 'Male' | 'Female';
  race: string;
  cohort: string;
  vaccineArm: string;
}

const cohortSizes = [63, 68, 72, 44];

export const participants: Participant[] = [];
let pid = 1;
COHORTS.forEach((cohort, ci) => {
  for (let i = 0; i < cohortSizes[ci]; i++) {
    const age = Math.round(Math.max(18, Math.min(74, 45 + rn() * 12)));
    const sex: 'Male' | 'Female' = rng() > 0.47 ? 'Male' : 'Female';
    const rv = rng();
    const race =
      rv < 0.53 ? 'White'
      : rv < 0.68 ? 'Black/AA'
      : rv < 0.80 ? 'Hispanic'
      : rv < 0.92 ? 'Asian'
      : 'Other';
    participants.push({ id: `P${String(pid++).padStart(3, '0')}`, age, sex, race, cohort, vaccineArm: VACCINE_ARMS[ci] });
  }
});

// ── HAI Titers ──────────────────────────────────────────────────────────────

export interface HAITiter {
  participantId: string;
  strain: string;
  day0: number;
  day28: number;
  day365: number;
}

const baseLog2: Record<string, number> = { H1N1: 6.2, H3N2: 5.8, 'B/Victoria': 5.4, 'B/Yamagata': 5.1 };
const rise28: Record<string, Record<string, number>> = {
  'TIV-HD':  { H1N1: 2.9, H3N2: 2.6, 'B/Victoria': 2.4, 'B/Yamagata': 2.2 },
  'TIV-SD':  { H1N1: 2.2, H3N2: 2.0, 'B/Victoria': 1.8, 'B/Yamagata': 1.6 },
  'LAIV':    { H1N1: 1.8, H3N2: 1.6, 'B/Victoria': 1.4, 'B/Yamagata': 1.3 },
  'Placebo': { H1N1: 0.1, H3N2: 0.1, 'B/Victoria': 0.1, 'B/Yamagata': 0.1 },
};

export const haiTiters: HAITiter[] = [];
participants.forEach(p => {
  STRAINS.forEach(strain => {
    const base = baseLog2[strain] + rn() * 0.9;
    const fc = rise28[p.vaccineArm][strain] + rn() * 0.5;
    const day0 = Math.max(2, base);
    const day28 = Math.max(day0 * 0.6, day0 + fc);
    const decay = Math.abs(rn() * 0.7 + 0.5);
    const day365 = Math.max(day0 * 0.7, day28 - decay + rn() * 0.3);
    haiTiters.push({ participantId: p.id, strain, day0, day28, day365 });
  });
});

// ── Box-plot stats ────────────────────────────────────────────────────────────

export interface BoxStats {
  label: string;
  whiskerLow: number;
  q1: number;
  median: number;
  q3: number;
  whiskerHigh: number;
}

function computeBoxStats(label: string, values: number[]): BoxStats {
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
  const subset = haiTiters.filter(t => t.strain === strain);
  return [
    computeBoxStats('Day 0',  subset.map(t => t.day0)),
    computeBoxStats('Day 28', subset.map(t => t.day28)),
    computeBoxStats('Day 365', subset.map(t => t.day365)),
  ];
}

export function getHAIScatterData(strain: string) {
  return haiTiters
    .filter(t => t.strain === strain)
    .map(t => {
      const p = participants.find(px => px.id === t.participantId)!;
      return { day0: +t.day0.toFixed(3), day28: +t.day28.toFixed(3), arm: p.vaccineArm };
    });
}

// Mean Day-28 titer per strain × vaccine arm (for heatmap)
export const haiHeatmap = STRAINS.map(strain => ({
  strain,
  values: VACCINE_ARMS.map(arm => {
    const vals = haiTiters
      .filter(t => t.strain === strain)
      .filter(t => participants.find(p => p.id === t.participantId)?.vaccineArm === arm)
      .map(t => t.day28);
    return { arm, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  }),
}));

// ── Demographics ──────────────────────────────────────────────────────────────

export const summaryStats = {
  participants: participants.length,
  modalities: 4,
  timepoints: 3,
  cohorts: COHORTS.length,
};

export const cohortCounts = COHORTS.map((c, i) => ({ cohort: c, count: cohortSizes[i] }));

const ageBins = ['18–25', '26–35', '36–45', '46–55', '56–65', '66+'];
const ageBinEdges = [18, 26, 36, 46, 56, 66, 100];
export const ageHistogram = ageBins.map((bin, i) => ({
  bin,
  count: participants.filter(p => p.age >= ageBinEdges[i] && p.age < ageBinEdges[i + 1]).length,
}));

export const sexData = [
  { name: 'Male',   value: participants.filter(p => p.sex === 'Male').length },
  { name: 'Female', value: participants.filter(p => p.sex === 'Female').length },
];

export const raceData = Array.from(RACES).map(race => ({
  race,
  count: participants.filter(p => p.race === race).length,
}));

export const vaccineArmData = Array.from(VACCINE_ARMS).map(arm => ({
  arm,
  value: participants.filter(p => p.vaccineArm === arm).length,
}));

// ── Correlations ──────────────────────────────────────────────────────────────

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const cov = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / n;
  const sx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) / n);
  const sy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0) / n);
  return sx && sy ? cov / (sx * sy) : 1;
}

export const correlationMatrix = STRAINS.map(s1 =>
  STRAINS.map(s2 => {
    const t1 = haiTiters.filter(t => t.strain === s1).sort((a, b) => a.participantId.localeCompare(b.participantId)).map(t => t.day0);
    const t2 = haiTiters.filter(t => t.strain === s2).sort((a, b) => a.participantId.localeCompare(b.participantId)).map(t => t.day0);
    return { strain1: s1, strain2: s2, r: +pearson(t1, t2).toFixed(3) };
  })
);

// Scatter explorer axes (label → accessor on a per-participant-strain record)
export type ScatterField = 'H1N1 D0' | 'H1N1 D28' | 'H3N2 D0' | 'H3N2 D28' | 'B/Vic D0' | 'B/Vic D28' | 'Age';
export const SCATTER_FIELDS: ScatterField[] = ['H1N1 D0', 'H1N1 D28', 'H3N2 D0', 'H3N2 D28', 'B/Vic D0', 'B/Vic D28', 'Age'];

function titersForStrain(strain: string, day: 'day0' | 'day28'): Map<string, number> {
  const m = new Map<string, number>();
  haiTiters.filter(t => t.strain === strain).forEach(t => m.set(t.participantId, t[day]));
  return m;
}

export function getScatterData(xField: ScatterField, yField: ScatterField, colorBy: 'arm' | 'sex' | 'cohort') {
  const h1n1d0 = titersForStrain('H1N1', 'day0');
  const h1n1d28 = titersForStrain('H1N1', 'day28');
  const h3n2d0 = titersForStrain('H3N2', 'day0');
  const h3n2d28 = titersForStrain('H3N2', 'day28');
  const bvicd0 = titersForStrain('B/Victoria', 'day0');
  const bvicd28 = titersForStrain('B/Victoria', 'day28');

  const getVal = (pid: string, field: ScatterField): number | null => {
    const p = participants.find(px => px.id === pid)!;
    switch (field) {
      case 'H1N1 D0': return h1n1d0.get(pid) ?? null;
      case 'H1N1 D28': return h1n1d28.get(pid) ?? null;
      case 'H3N2 D0': return h3n2d0.get(pid) ?? null;
      case 'H3N2 D28': return h3n2d28.get(pid) ?? null;
      case 'B/Vic D0': return bvicd0.get(pid) ?? null;
      case 'B/Vic D28': return bvicd28.get(pid) ?? null;
      case 'Age': return p.age;
      default: return null;
    }
  };

  return participants.map(p => {
    const x = getVal(p.id, xField);
    const y = getVal(p.id, yField);
    if (x === null || y === null) return null;
    const color = colorBy === 'arm' ? p.vaccineArm : colorBy === 'sex' ? p.sex : p.cohort;
    return { x: +x.toFixed(3), y: +y.toFixed(3), group: color, pid: p.id };
  }).filter(Boolean) as { x: number; y: number; group: string; pid: string }[];
}

// ── Immune cell features ──────────────────────────────────────────────────────

const rng2 = seededRng(99);
const rn2 = () => boxMuller(rng2);

export const IMMUNE_FEATURES = [
  'CD4+ T', 'CD8+ T', 'NK Cells', 'B Cells',
  'Monocytes', 'Plasmablasts', 'Tregs', 'MAIT Cells',
];

export const immuneFeatures = IMMUNE_FEATURES.map(feature => ({
  feature,
  day0: +(3 + Math.abs(rn2()) * 6).toFixed(2),
  day7: +(3 + Math.abs(rn2()) * 10).toFixed(2),
}));

// ── Model predictions ─────────────────────────────────────────────────────────

export const TASKS = [
  { id: '4.1',  label: 'H1N1 D28 Titer',     strain: 'H1N1',       day: 28 },
  { id: '4.2',  label: 'H3N2 D28 Titer',     strain: 'H3N2',       day: 28 },
  { id: '4.3',  label: 'B/Vic D28 Titer',    strain: 'B/Victoria', day: 28 },
  { id: '4.4',  label: 'B/Yam D28 Titer',    strain: 'B/Yamagata', day: 28 },
  { id: '4.5',  label: 'H1N1 D365 Titer',    strain: 'H1N1',       day: 365 },
  { id: '4.6',  label: 'H3N2 D365 Titer',    strain: 'H3N2',       day: 365 },
  { id: '4.7',  label: 'B/Vic D365 Titer',   strain: 'B/Victoria', day: 365 },
  { id: '4.8',  label: 'B/Yam D365 Titer',   strain: 'B/Yamagata', day: 365 },
  { id: '4.9',  label: 'MFC Score',           strain: 'H1N1',       day: 28 },
  { id: '4.10', label: 'Response Rate',       strain: 'H3N2',       day: 28 },
];

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

export interface TaskPrediction { id: string; actual: number; predicted: number; }

const taskPredCache = new Map<string, TaskPrediction[]>();

export function getTaskPredictions(taskId: string): TaskPrediction[] {
  if (taskPredCache.has(taskId)) return taskPredCache.get(taskId)!;
  const tidx = TASKS.findIndex(t => t.id === taskId);
  const tr = seededRng(tidx * 1000 + 7);
  const tn = () => boxMuller(tr);
  const task = TASKS[tidx];
  const noiseLevel = 0.4 + (tidx * 0.07) % 0.5;
  const preds = participants.slice(0, 60).map(p => {
    const titer = haiTiters.find(t => t.participantId === p.id && t.strain === task.strain);
    const actual = titer ? (task.day === 28 ? titer.day28 : task.day === 365 ? titer.day365 : titer.day0) : 6 + tn();
    const predicted = actual + tn() * noiseLevel;
    return { id: p.id, actual: +actual.toFixed(3), predicted: +predicted.toFixed(3) };
  });
  taskPredCache.set(taskId, preds);
  return preds;
}

export function getTaskScore(taskId: string): number {
  const preds = getTaskPredictions(taskId);
  return +spearmanRho(preds.map(p => p.actual), preds.map(p => p.predicted)).toFixed(3);
}

export const allTaskScores = TASKS.map(t => ({ task: t.id, label: t.label, score: getTaskScore(t.id) }));

// ── Participant deep-dive ─────────────────────────────────────────────────────

export function getParticipantTiters(pid: string) {
  return haiTiters.filter(t => t.participantId === pid).map(t => ({
    strain: t.strain,
    day0: +t.day0.toFixed(2),
    day28: +t.day28.toFixed(2),
    day365: +t.day365.toFixed(2),
  }));
}

export function getParticipantPredictions(pid: string) {
  return TASKS.map(task => {
    const preds = getTaskPredictions(task.id);
    const entry = preds.find(p => p.id === pid);
    return { taskId: task.id, label: task.label, actual: entry?.actual ?? null, predicted: entry?.predicted ?? null };
  });
}
