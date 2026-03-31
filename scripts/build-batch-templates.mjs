import fs from 'node:fs'
import path from 'node:path'

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

function csvEscape(value) {
  const s = String(value ?? '')
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replaceAll('"', '""') + '"'
  }
  return s
}

function writeCsv(rows, filePath, headers) {
  const out = []
  out.push(headers.join(','))
  for (const row of rows) {
    out.push(headers.map((h) => csvEscape(row[h] ?? '')).join(','))
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, out.join('\n'), 'utf8')
}

function emptyToNull(value) {
  const v = String(value ?? '').trim()
  return v.length ? v : null
}

function membershipRequiredFromType(type = '') {
  const hasMember = String(type).includes('회원')
  const hasPublic = String(type).includes('대중')
  if (hasMember && !hasPublic) return true
  return false
}

function regionSecondaryFromAddress(addr = '', fallbackRegion = '') {
  const parts = String(addr).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''

  const isPrimaryToken = (token) => {
    const raw = String(token || '')
    return raw === fallbackRegion || /(특별자치도|특별자치시|광역시|특별시|도)$/.test(raw)
  }

  let token = parts.find((part) => !isPrimaryToken(part)) || parts[1] || parts[0]
  token = token.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '') || ''
  return token
}

const inputArgIndex = process.argv.indexOf('--input-json')
if (inputArgIndex === -1) {
  console.error('Usage: node scripts/build-batch-templates.mjs --input-json <batch.json> [--out-prefix <name>]')
  process.exit(1)
}

const outPrefixIndex = process.argv.indexOf('--out-prefix')
const batchPath = process.argv[inputArgIndex + 1]
const outPrefix = outPrefixIndex >= 0 ? process.argv[outPrefixIndex + 1] : path.basename(batchPath).replace(/\.json$/i, '')

const root = 'C:/Users/javas/.openclaw/workspace-javes'
const bulkPath = path.join(root, 'data', 'bulk_import_ready.csv')

const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'))
const bulk = parseCsv(bulkPath)
const bulkByName = new Map(bulk.map((r) => [r.name, r]))

// Load canonical policies from pilot20 template (option2: copy confirmed values when present)
const pilotPoliciesPath = path.resolve('data', 'templates', 'booking_policies_20_template.csv')
const pilotPolicies = fs.existsSync(pilotPoliciesPath) ? parseCsv(pilotPoliciesPath) : []
const pilotPolicyBySlugType = new Map(pilotPolicies.map((p) => [`${p.course_slug}:${p.policy_type}`, p]))

const slugs = []
for (const row of batch.rows) {
  const slug = row.safe_slug || row.staging_slug
  if (!slug) throw new Error(`Missing slug for row input_name=${row.input_name}`)
  slugs.push(slug)
}

const courses = []
const policies = []
const sources = []

for (const row of batch.rows) {
  const slug = row.safe_slug || row.staging_slug
  const src = bulkByName.get(row.input_name)
  if (!src) throw new Error(`Missing bulk_import_ready row for input_name=${row.input_name}`)

  courses.push({
    slug,
    name: src.name,
    english_name: '',
    region_primary: src.region,
    region_secondary: regionSecondaryFromAddress(src.addr, src.region),
    address: emptyToNull(src.addr) ?? '',
    phone: '',
    homepage_url: '',
    booking_url: '',
    map_url: '',
    membership_required: membershipRequiredFromType(src.type) ? 'true' : 'false',
    membership_note: emptyToNull(src.type) ?? '',
    booking_note: emptyToNull(`odcloud batch import / holes=${src.holes} / source_count=${src.source_count}`) ?? '',
    status: 'active',
    verification_status: 'draft',
  })

  // default policy row
  const type = 'days_before'
  const key = `${slug}:${type}`
  const fromPilot = pilotPolicyBySlugType.get(key)

  policies.push({
    course_slug: slug,
    policy_type: type,
    policy_summary: fromPilot?.policy_summary ?? '',
    source_text: fromPilot?.source_text ?? '',
    days_before_open: fromPilot?.days_before_open ?? '',
    open_weekday: fromPilot?.open_weekday ?? '',
    open_time: fromPilot?.open_time ?? '',
    monthly_open_day: fromPilot?.monthly_open_day ?? '',
    monthly_offset_months: fromPilot?.monthly_offset_months ?? '',
    rule_interpretation: fromPilot?.rule_interpretation ?? '',
    manual_open_datetime: fromPilot?.manual_open_datetime ?? '',
    is_active: fromPilot?.is_active ?? 'true',
    note: fromPilot?.note ?? '',
  })

  sources.push({
    course_slug: slug,
    policy_type: type,
    source_type: 'manual',
    source_url: 'https://api.odcloud.kr/api/15118920/v1/uddi:0e5b12d2-1cc8-4caf-ba96-c2c7d1ef8d83',
    source_title: '문화체육관광부 전국 골프장 현황 (batch import)',
    captured_text: `batch import / ${src.name} / ${src.addr} / ${src.type}`,
    is_current: 'true',
    note: outPrefix,
  })
}

// de-dupe courses by slug (just in case)
const seen = new Set()
const coursesDedup = []
for (const c of courses) {
  if (seen.has(c.slug)) continue
  seen.add(c.slug)
  coursesDedup.push(c)
}

const outDir = path.resolve('data', 'templates')
const coursesOut = path.join(outDir, `golf_courses_${outPrefix}_template.csv`)
const policiesOut = path.join(outDir, `booking_policies_${outPrefix}_template.csv`)
const sourcesOut = path.join(outDir, `source_records_${outPrefix}_template.csv`)

writeCsv(
  coursesDedup,
  coursesOut,
  [
    'slug',
    'name',
    'english_name',
    'region_primary',
    'region_secondary',
    'address',
    'phone',
    'homepage_url',
    'booking_url',
    'map_url',
    'membership_required',
    'membership_note',
    'booking_note',
    'status',
    'verification_status',
  ]
)

writeCsv(
  policies,
  policiesOut,
  [
    'course_slug',
    'policy_type',
    'policy_summary',
    'source_text',
    'days_before_open',
    'open_weekday',
    'open_time',
    'monthly_open_day',
    'monthly_offset_months',
    'rule_interpretation',
    'manual_open_datetime',
    'is_active',
    'note',
  ]
)

writeCsv(
  sources,
  sourcesOut,
  ['course_slug', 'policy_type', 'source_type', 'source_url', 'source_title', 'captured_text', 'is_current', 'note']
)

console.log(
  JSON.stringify(
    {
      outPrefix,
      batchRows: batch.rows.length,
      courses: coursesDedup.length,
      policies: policies.length,
      sources: sources.length,
      outputs: { coursesOut, policiesOut, sourcesOut },
    },
    null,
    2
  )
)
