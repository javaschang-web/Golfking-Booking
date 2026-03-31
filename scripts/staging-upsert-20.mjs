import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  const out = {}
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
  }
  return out
}

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

function emptyToNull(value) {
  const v = String(value ?? '').trim()
  return v.length ? v : null
}

function regionSecondaryFromAddress(addr = '', fallbackRegion = '') {
  const parts = String(addr).trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return null

  const isPrimaryToken = (token) => {
    const raw = String(token || '')
    return raw === fallbackRegion || /(특별자치도|특별자치시|광역시|특별시|도)$/.test(raw)
  }

  let token = parts.find((part) => !isPrimaryToken(part)) || parts[1] || parts[0]
  return token.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '') || null
}

function membershipRequiredFromType(type = '') {
  const hasMember = type.includes('회원')
  const hasPublic = type.includes('대중')
  if (hasMember && !hasPublic) return true
  return false
}

const generatedSlugMap = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/generated_slug_map.json', 'utf8'))
const slugMap = {
  ...generatedSlugMap,
  '태광CC': 'taegwang-cc',
  '레이크사이드CC': 'lakeside-cc',
  '골프존카운티 안성H': 'golfzon-county-ansung-h',
  '드림파크골프장': 'dreampark-golf-course',
  '오렌지듄스골프클럽': 'orange-dunes-golf-club',
}

const dryRun = process.argv.includes('--dry-run')
const inputArgIndex = process.argv.indexOf('--input-json')
const reportArgIndex = process.argv.indexOf('--report-prefix')
const testsetPath = inputArgIndex >= 0 ? process.argv[inputArgIndex + 1] : 'C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_20.json'
const reportPrefix = reportArgIndex >= 0 ? process.argv[reportArgIndex + 1] : path.basename(testsetPath).replace(/\.json$/i, '')
const env = loadEnvFile(path.resolve('.env.local'))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const testset = JSON.parse(fs.readFileSync(testsetPath, 'utf8')).rows
const input = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
const inputByName = new Map(input.map((r) => [r.name, r]))

const backup = { createdAt: new Date().toISOString(), dryRun, before_courses: [], before_source_records: [] }
const results = []

for (const item of testset) {
  const src = inputByName.get(item.input_name)
  if (!src) throw new Error(`Missing source row for ${item.input_name}`)

  const slug = item.mode.startsWith('update') ? item.staging_slug : (item.safe_slug || slugMap[item.input_name])
  if (!slug) throw new Error(`No slug mapping for insert ${item.input_name}`)

  const { data: existingCourse, error: existingCourseError } = await supabase
    .from('golf_courses')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (existingCourseError) throw existingCourseError
  if (existingCourse) backup.before_courses.push(existingCourse)

  const payload = {
    slug,
    name: src.name,
    region_primary: src.region,
    region_secondary: regionSecondaryFromAddress(src.addr, src.region),
    address: emptyToNull(src.addr),
    membership_required: membershipRequiredFromType(src.type),
    membership_note: emptyToNull(src.type),
    booking_note: emptyToNull(`odcloud pilot import / holes=${src.holes} / source_count=${src.source_count}`),
    status: 'active',
    verification_status: existingCourse?.verification_status ?? 'draft',
  }

  results.push({ mode: item.mode, slug, name: payload.name, action: existingCourse ? 'UPSERT_UPDATE' : 'UPSERT_INSERT' })

  if (dryRun) continue

  const { error: upsertError } = await supabase.from('golf_courses').upsert(payload, { onConflict: 'slug' })
  if (upsertError) throw upsertError

  const { data: courseAfter, error: courseAfterError } = await supabase
    .from('golf_courses')
    .select('id,slug,name')
    .eq('slug', slug)
    .single()
  if (courseAfterError) throw courseAfterError

  const sourcePayload = {
    golf_course_id: courseAfter.id,
    source_type: 'manual',
    source_url: 'https://api.odcloud.kr/api/15118920/v1/uddi:0e5b12d2-1cc8-4caf-ba96-c2c7d1ef8d83',
    source_title: '문화체육관광부 전국 골프장 현황 (pilot import)',
    captured_text: `pilot import / ${src.name} / ${src.addr} / ${src.type}`,
    is_current: true,
    note: `${reportPrefix.replace(/_/g, ' ')} / ${item.mode}`,
  }
  const { error: sourceError } = await supabase.from('source_records').insert(sourcePayload)
  if (sourceError) throw sourceError

  const { error: logError } = await supabase.from('change_logs').insert({
    entity_type: 'golf_course',
    entity_id: courseAfter.id,
    action_type: item.mode.startsWith('update') ? 'pilot_upsert_update' : 'pilot_upsert_insert',
    changed_fields: payload,
    note: `${reportPrefix.replace(/_/g, ' ')} / ${item.reason}`,
  })
  if (logError) throw logError
}

fs.mkdirSync('C:/Users/javas/.openclaw/workspace-javes/backups', { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
fs.writeFileSync(`C:/Users/javas/.openclaw/workspace-javes/backups/${reportPrefix}_backup_${stamp}.json`, JSON.stringify(backup, null, 2))
fs.writeFileSync(`C:/Users/javas/.openclaw/workspace-javes/reports/${reportPrefix}_apply_result.json`, JSON.stringify({ dryRun, results }, null, 2))
console.log(JSON.stringify({ dryRun, count: results.length, updates: results.filter(r => r.action === 'UPSERT_UPDATE').length, inserts: results.filter(r => r.action === 'UPSERT_INSERT').length }, null, 2))
