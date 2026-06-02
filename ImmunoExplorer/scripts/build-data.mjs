// Preprocesses ../cleaned_data/train_combined.csv into a compact JSON that the
// dashboard imports directly. Drops the transcriptomic PCs (not visualised) and
// stores only non-null HAI titers. Re-run with: npm run build:data
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(__dirname, '../../cleaned_data/train_combined.csv');
const outPath = resolve(__dirname, '../src/app/data/realData.json');

function parseLine(line) {
  const out = [];
  let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}

const raw = readFileSync(csvPath, 'utf8');
const lines = raw.split(/\r?\n/).filter(l => l.length);
const header = parseLine(lines[0]);
const rows = lines.slice(1).map(parseLine);

const iId = header.indexOf('participant_id');
const iSex = header.indexOf('PART_biological_sex');
const iArm = header.indexOf('PART_arm_name');
const iAge = header.indexOf('PART_age');

// Map HAI columns -> { strain, day, colIndex }
const GROUP_ORDER = { H1N1: 0, H3N2: 1, Vic: 2, Yam: 3, Anc: 4 };
const haiCols = [];
for (let c = 0; c < header.length; c++) {
  const m = header[c].match(/^HAI_(.*)_d(0|28|365)$/);
  if (m) haiCols.push({ strain: m[1], day: 'd' + m[2], col: c });
}

// Distinct strains, ordered by group then name
const strainSet = [...new Set(haiCols.map(h => h.strain))];
strainSet.sort((a, b) => {
  const ga = GROUP_ORDER[a.split(' ')[0]] ?? 9;
  const gb = GROUP_ORDER[b.split(' ')[0]] ?? 9;
  return ga !== gb ? ga - gb : a.localeCompare(b);
});
const strainIdx = new Map(strainSet.map((s, i) => [s, i]));

const round3 = v => (v == null || v === '' || isNaN(+v)) ? null : Math.round(+v * 1000) / 1000;

// Participants + titers (only rows with at least one measured timepoint)
const participants = [];
const titers = []; // [pIdx, sIdx, d0, d28, d365]
const strainTotals = new Array(strainSet.length).fill(0);

rows.forEach((r, pIdx) => {
  participants.push({
    id: r[iId],
    sex: r[iSex] === 'male' ? 'Male' : r[iSex] === 'female' ? 'Female' : (r[iSex] || 'Unknown'),
    age: Math.round(+r[iAge]) || null,
    arm: r[iArm] || 'Unknown',
  });
  // gather per-strain measurements for this participant
  const perStrain = new Map(); // sIdx -> {d0,d28,d365}
  for (const h of haiCols) {
    const v = round3(r[h.col]);
    if (v == null) continue;
    const si = strainIdx.get(h.strain);
    if (!perStrain.has(si)) perStrain.set(si, { d0: null, d28: null, d365: null });
    perStrain.get(si)[h.day] = v;
  }
  for (const [si, t] of perStrain) {
    titers.push([pIdx, si, t.d0, t.d28, t.d365]);
    strainTotals[si] += (t.d0 != null) + (t.d28 != null) + (t.d365 != null);
  }
});

// Core strains: top 16 by total measurements (used for the correlation matrix /
// scatter explorer where a full 68x68 grid would be unreadable).
const coreStrains = strainSet
  .map((s, i) => ({ i, tot: strainTotals[i] }))
  .sort((a, b) => b.tot - a.tot)
  .slice(0, 16)
  .map(x => x.i)
  .sort((a, b) => a - b);

// Arms ordered by participant count desc
const armCounts = {};
participants.forEach(p => { armCounts[p.arm] = (armCounts[p.arm] || 0) + 1; });
const arms = Object.keys(armCounts).sort((a, b) => armCounts[b] - armCounts[a]);

const out = {
  meta: {
    strains: strainSet,
    strainGroups: strainSet.map(s => s.split(' ')[0]),
    coreStrains,
    arms,
    generatedFrom: 'cleaned_data/train_combined.csv',
  },
  participants,
  titers,
};

writeFileSync(outPath, JSON.stringify(out));
const kb = (Buffer.byteLength(JSON.stringify(out)) / 1024).toFixed(0);
console.log(`Wrote ${outPath}`);
console.log(`  participants=${participants.length} strains=${strainSet.length} titerRows=${titers.length} size=${kb}KB`);
console.log(`  arms=${JSON.stringify(arms)}`);
console.log(`  coreStrains=${coreStrains.map(i => strainSet[i]).join(', ')}`);
