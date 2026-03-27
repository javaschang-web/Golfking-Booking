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
const byName = new Map(input.map((r) => [r.name, r]))

const manualApproved = new Map([
  ['롯데스카이힐 제주', '㈜호텔롯데스카이힐제주CC'],
  ['제이드팰리스', '제이드팰리스 골프클럽'],
  ['벨라스톤', '벨라스톤컨트리클럽'],
  ['오크밸리', '오크밸리회원제골프장'],
])

const slugMap = {
  '태광CC': 'taegwang-cc',
  '레이크사이드CC': 'lakeside-cc',
  '골프존카운티 안성H': 'golfzon-county-ansung-h',
  '드림파크골프장': 'dreampark-golf-course',
  '오렌지듄스골프클럽': 'orange-dunes-golf-club',
}

const selected = []
const usedNames = new Set()

for (const m of fallback.auto_matches) {
  const row = byName.get(m.input_name)
  if (!row) continue
  selected.push({ mode: 'update-auto', staging_slug: m.staging_slug, staging_name: m.staging_name, input_name: row.name, input_addr: row.addr, region: row.region, holes: row.holes, type: row.type, reason: 'fallback auto-match' })
  usedNames.add(row.name)
}

for (const mr of fallback.manual_review) {
  const picked = manualApproved.get(mr.staging_name)
  if (!picked) continue
  const row = byName.get(picked)
  if (!row) continue
  selected.push({ mode: 'update-manual', staging_slug: mr.staging_slug, staging_name: mr.staging_name, input_name: row.name, input_addr: row.addr, region: row.region, holes: row.holes, type: row.type, reason: 'manual-approved fallback match' })
  usedNames.add(row.name)
}

for (const row of input) {
  if (selected.length >= 100) break
  if (usedNames.has(row.name)) continue
  if (!row.name || !row.region) continue
  const slug = slugMap[row.name] || ''
  selected.push({ mode: 'insert-new', staging_slug: slug, staging_name: '', input_name: row.name, input_addr: row.addr, region: row.region, holes: row.holes, type: row.type, reason: 'new insert candidate' })
  usedNames.add(row.name)
}

const finalSet = selected.slice(0, 100)
const summary = {
  total: finalSet.length,
  update_auto: finalSet.filter((x) => x.mode === 'update-auto').length,
  update_manual: finalSet.filter((x) => x.mode === 'update-manual').length,
  insert_new: finalSet.filter((x) => x.mode === 'insert-new').length,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100.json', JSON.stringify({ summary, rows: finalSet }, null, 2))
const header = ['mode', 'staging_slug', 'staging_name', 'input_name', 'input_addr', 'region', 'holes', 'type', 'reason']
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100.csv', [header.join(','), ...finalSet.map((r) => header.map((h) => esc(r[h])).join(','))].join('\n'))
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100.md', ['# staging testset 100', '', `- total: ${summary.total}`, `- update_auto: ${summary.update_auto}`, `- update_manual: ${summary.update_manual}`, `- insert_new: ${summary.insert_new}`, ''].join('\n'))
console.log(JSON.stringify(summary, null, 2))
