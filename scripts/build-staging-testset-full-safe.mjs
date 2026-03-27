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
const fallback = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.json', 'utf8'))
const safeSlugMap = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/safe_slug_map.json', 'utf8'))
const byName = new Map(input.map((r) => [r.name, r]))

const manualApproved = new Map([
  ['롯데스카이힐 제주', '㈜호텔롯데스카이힐제주CC'],
  ['제이드팰리스', '제이드팰리스 골프클럽'],
  ['벨라스톤', '벨라스톤컨트리클럽'],
  ['오크밸리', '오크밸리회원제골프장'],
])

const selected = []
const usedNames = new Set()

for (const m of fallback.auto_matches) {
  const row = byName.get(m.input_name)
  if (!row) continue
  selected.push({
    mode: 'update-auto',
    staging_slug: m.staging_slug,
    staging_name: m.staging_name,
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: 'fallback auto-match',
    safe_slug: m.staging_slug,
  })
  usedNames.add(row.name)
}

for (const mr of fallback.manual_review) {
  const picked = manualApproved.get(mr.staging_name)
  if (!picked) continue
  const row = byName.get(picked)
  if (!row) continue
  selected.push({
    mode: 'update-manual',
    staging_slug: mr.staging_slug,
    staging_name: mr.staging_name,
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: 'manual-approved fallback match',
    safe_slug: mr.staging_slug,
  })
  usedNames.add(row.name)
}

for (const row of input) {
  if (usedNames.has(row.name)) continue
  if (!row.name || !row.region) continue
  selected.push({
    mode: 'insert-new',
    staging_slug: '',
    staging_name: '',
    input_name: row.name,
    input_addr: row.addr,
    region: row.region,
    holes: row.holes,
    type: row.type,
    reason: 'full insert candidate',
    safe_slug: safeSlugMap[row.name],
  })
  usedNames.add(row.name)
}

const summary = {
  total: selected.length,
  update_auto: selected.filter((x) => x.mode === 'update-auto').length,
  update_manual: selected.filter((x) => x.mode === 'update-manual').length,
  insert_new: selected.filter((x) => x.mode === 'insert-new').length,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_full_safe.json', JSON.stringify({ summary, rows: selected }, null, 2))
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_full_safe.md', ['# staging testset full safe', '', `- total: ${summary.total}`, `- update_auto: ${summary.update_auto}`, `- update_manual: ${summary.update_manual}`, `- insert_new: ${summary.insert_new}`, ''].join('\n'))
console.log(JSON.stringify(summary, null, 2))
