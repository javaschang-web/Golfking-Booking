import fs from 'node:fs'

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
        continue
      }
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }
    current += char
  }
  result.push(current)
  return result
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim()
  const lines = raw.split(/\r?\n/)
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^"|"$/g, ''))
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    headers.forEach((header, i) => {
      row[header] = (cols[i] ?? '').replace(/^"|"$/g, '')
    })
    return row
  })
}

const input = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
const report = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.json', 'utf8'))

const byName = new Map(input.map((r) => [r.name, r]))

const manualPickMap = new Map([
  ['롯데스카이힐 제주', '㈜호텔롯데스카이힐제주CC'],
  ['제이드팰리스', '제이드팰리스 골프클럽'],
  ['벨라스톤', '벨라스톤컨트리클럽'],
  ['오크밸리', '오크밸리회원제골프장'],
])

const insertPickNames = [
  '태광CC',
  '레이크사이드CC',
  '골프존카운티 안성H',
  '드림파크골프장',
  '오렌지듄스골프클럽',
]

const selections = []

for (const m of report.auto_matches) {
  const row = byName.get(m.input_name)
  if (!row) continue
  selections.push({
    mode: 'update-auto',
    staging_slug: m.staging_slug,
    staging_name: m.staging_name,
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: 'fallback auto-match',
  })
}

for (const mr of report.manual_review) {
  const pickedName = manualPickMap.get(mr.staging_name)
  if (!pickedName) continue
  const picked = mr.top_candidates.find((c) => c.input_name === pickedName)
  if (!picked) continue
  const row = byName.get(picked.input_name)
  if (!row) continue
  selections.push({
    mode: 'update-manual',
    staging_slug: mr.staging_slug,
    staging_name: mr.staging_name,
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: `manual-picked from fallback candidates (score ${picked.score})`,
  })
}

for (const name of insertPickNames) {
  const row = byName.get(name)
  if (!row) continue
  selections.push({
    mode: 'insert-new',
    staging_slug: '',
    staging_name: '',
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: 'new insert candidate',
  })
}

const finalSet = selections.slice(0, 20)

const summary = {
  total: finalSet.length,
  update_auto: finalSet.filter((x) => x.mode === 'update-auto').length,
  update_manual: finalSet.filter((x) => x.mode === 'update-manual').length,
  insert_new: finalSet.filter((x) => x.mode === 'insert-new').length,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_20.json', JSON.stringify({ summary, rows: finalSet }, null, 2))

const header = ['mode', 'staging_slug', 'staging_name', 'input_name', 'input_addr', 'region', 'holes', 'type', 'reason']
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const csv = [header.join(',')]
for (const row of finalSet) {
  csv.push(header.map((h) => esc(row[h])).join(','))
}
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_20.csv', csv.join('\n'))

const md = [
  '# staging testset 20',
  '',
  `- total: ${summary.total}`,
  `- update_auto: ${summary.update_auto}`,
  `- update_manual: ${summary.update_manual}`,
  `- insert_new: ${summary.insert_new}`,
  '',
  '## rows',
  ...finalSet.map((r, i) => `${i + 1}. [${r.mode}] ${r.input_name}${r.staging_slug ? ` -> ${r.staging_slug}` : ''} / ${r.reason}`),
  '',
]
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_20.md', md.join('\n'))

console.log(JSON.stringify(summary, null, 2))
