import fs from 'fs';
import path from 'path';

// Read the complete JSON object from user prompt
const fullDataRaw = fs.readFileSync('/tmp/user_raw_data.json', 'utf8');
const parsed = JSON.parse(fullDataRaw);

// Add legacy_id to all items
parsed.data.classes = (parsed.data.classes || []).map(c => ({
  ...c,
  keterangan: c.keterangan || '',
  legacy_id: c.legacy_id || c.id
}));

parsed.data.students = (parsed.data.students || []).map(s => ({
  ...s,
  legacy_id: s.legacy_id || s.id
}));

parsed.data.sessions = (parsed.data.sessions || []).map(s => ({
  ...s,
  legacy_id: s.legacy_id || s.id
}));

parsed.data.grades = (parsed.data.grades || []).map(g => ({
  ...g,
  legacy_id: g.legacy_id || g.id
}));

parsed.data.agendas = (parsed.data.agendas || []).map(a => ({
  ...a,
  legacy_id: a.legacy_id || a.id
}));

parsed.data.savings = (parsed.data.savings || []).map(s => ({
  ...s,
  legacy_id: s.legacy_id || s.id
}));

fs.writeFileSync('/src/data/hendraInitialData.json', JSON.stringify(parsed, null, 2), 'utf8');

const tsContent = `// Auto-generated seed data from official user backup
export const HENDRA_MASTER_DATA = ${JSON.stringify(parsed, null, 2)} as const;
`;

fs.writeFileSync('/src/data/seedData.ts', tsContent, 'utf8');
console.log('Seed data generated successfully!');
