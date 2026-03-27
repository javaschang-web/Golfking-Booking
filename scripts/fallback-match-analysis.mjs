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

function norm(s) {
  return String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\",.'`()\-_/]/g, '')
    .trim()
}

function stripCourseName(s) {
  return norm(s)
    .replace(/일반대중홀/g, '')
    .replace(/회원제/g, '')
    .replace(/대중제/g, '')
    .replace(/퍼블릭/g, '')
    .replace(/public/g, '')
    .replace(/컨트리구락부/g, '')
    .replace(/컨트리클럽/g, '')
    .replace(/골프클럽/g, '')
    .replace(/골프장/g, '')
    .replace(/골프앤리조트/g, '')
    .replace(/골프&리조트/g, '')
    .replace(/리조트/g, '')
    .replace(/countryclub/g, '')
    .replace(/country/g, '')
    .replace(/club/g, '')
    .replace(/golf/g, '')
    .replace(/cc/g, '')
    .replace(/gc/g, '')
    .trim()
}

function regionSecondaryVariants(addr = '') {
  const token = String(addr).trim().split(/\s+/)[0] || ''
  const n = norm(token)
  const stripped = n.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '')
  return Array.from(new Set([n, stripped].filter(Boolean)))
}

function existingSecondaryVariants(regionSecondary = '') {
  const n = norm(regionSecondary)
  const stripped = n.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '')
  return Array.from(new Set([n, stripped].filter(Boolean)))
}

function cityMatches(inputAddr, existingSecondary) {
  if (!existingSecondary) return true
  const a = regionSecondaryVariants(inputAddr)
  const b = existingSecondaryVariants(existingSecondary)
  return a.some((x) => b.some((y) => x.includes(y) || y.includes(x)))
}

function scoreCandidate(existing, input) {
  const en = stripCourseName(existing.name)
  const inn = stripCourseName(input.name)
  const sameRegion = norm(existing.region_primary) === norm(input.region)
  const sameCity = cityMatches(input.addr, existing.region_secondary)
  if (!sameRegion) return 0
  if (en && inn && en === inn && sameCity) return 100
  if (en && inn && (en.includes(inn) || inn.includes(en)) && sameCity) return 70
  if (en && inn && en === inn) return 60
  if (en && inn && (en.includes(inn) || inn.includes(en))) return 40
  return 0
}

const input = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
const staging = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_courses_export.json', 'utf8'))

const autoMatches = []
const manualReview = []
const noMatch = []

for (const existing of staging) {
  const candidates = input
    .map((row) => ({ row, score: scoreCandidate(existing, row) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name, 'ko'))

  const top = candidates[0]
  const topCount = candidates.filter((c) => c.score === (top?.score ?? -1)).length

  if (top && top.score >= 100 && topCount === 1) {
    autoMatches.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      input_name: top.row.name,
      input_addr: top.row.addr,
      score: top.score,
    })
  } else if (candidates.length > 0) {
    manualReview.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      top_candidates: candidates.slice(0, 5).map((c) => ({
        input_name: c.row.name,
        input_addr: c.row.addr,
        region: c.row.region,
        score: c.score,
      })),
    })
  } else {
    noMatch.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      region_primary: existing.region_primary,
      region_secondary: existing.region_secondary,
    })
  }
}

const report = {
  staging_total: staging.length,
  input_total: input.length,
  auto_match_count: autoMatches.length,
  manual_review_count: manualReview.length,
  no_match_count: noMatch.length,
  auto_matches: autoMatches,
  manual_review: manualReview,
  no_match: noMatch,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.json', JSON.stringify(report, null, 2))

const md = [
  '# fallback match report',
  '',
  `- staging_total: ${report.staging_total}`,
  `- input_total: ${report.input_total}`,
  `- auto_match_count: ${report.auto_match_count}`,
  `- manual_review_count: ${report.manual_review_count}`,
  `- no_match_count: ${report.no_match_count}`,
  '',
  '## auto matches',
  ...autoMatches.map((m) => `- ${m.staging_name} (${m.staging_slug}) -> ${m.input_name} / ${m.input_addr}`),
  '',
  '## manual review',
  ...manualReview.map((m) => `- ${m.staging_name} (${m.staging_slug}) -> ${m.top_candidates.map((c) => `${c.input_name} [${c.score}]`).join(', ')}`),
  '',
  '## no match',
  ...noMatch.map((m) => `- ${m.staging_name} (${m.staging_slug}) / ${m.region_primary} ${m.region_secondary ?? ''}`),
  '',
]
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.md', md.join('\n'))
console.log(JSON.stringify({
  auto_match_count: report.auto_match_count,
  manual_review_count: report.manual_review_count,
  no_match_count: report.no_match_count,
}, null, 2))
