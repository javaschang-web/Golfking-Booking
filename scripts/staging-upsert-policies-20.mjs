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
  return lines
    .slice(1)
    .filter(Boolean)
    .map((line) => {
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

function bool(value) {
  return String(value).toLowerCase() === 'true'
}

function intOrNull(value) {
  const v = String(value ?? '').trim()
  if (!v) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

const dryRun = process.argv.includes('--dry-run')
const templatesDir = process.env.TEMPLATES_DIR
  ? path.resolve(process.cwd(), process.env.TEMPLATES_DIR)
  : path.resolve(process.cwd(), 'data', 'templates')

const env = loadEnvFile(path.resolve('.env.local'))
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const policiesPath = path.join(templatesDir, 'booking_policies_20_template.csv')
  if (!fs.existsSync(policiesPath)) {
    console.error('[staging-upsert-policies-20] missing template file:', policiesPath)
    process.exit(1)
  }

  const rows = parseCsv(policiesPath)
  const courseSlugs = [...new Set(rows.map((r) => r.course_slug).filter(Boolean))]

  const { data: courses, error: coursesErr } = await supabase.from('golf_courses').select('id,slug').in('slug', courseSlugs)
  if (coursesErr) throw coursesErr

  const courseIdBySlug = new Map((courses ?? []).map((c) => [c.slug, c.id]))

  let updates = 0
  let inserts = 0
  let skipsNoCourse = 0

  for (const row of rows) {
    const courseId = courseIdBySlug.get(row.course_slug)
    if (!courseId) {
      skipsNoCourse++
      continue
    }

    const { data: existing, error: exErr } = await supabase
      .from('booking_policies')
      .select('id')
      .eq('golf_course_id', courseId)
      .eq('policy_type', row.policy_type)
      .maybeSingle()
    if (exErr) throw exErr

    const payload = {
      golf_course_id: courseId,
      policy_type: row.policy_type,
      policy_summary: emptyToNull(row.policy_summary),
      source_text: emptyToNull(row.source_text),
      days_before_open: intOrNull(row.days_before_open),
      open_weekday: intOrNull(row.open_weekday),
      open_time: emptyToNull(row.open_time),
      monthly_open_day: intOrNull(row.monthly_open_day),
      monthly_offset_months: intOrNull(row.monthly_offset_months),
      rule_interpretation: emptyToNull(row.rule_interpretation),
      manual_open_datetime: emptyToNull(row.manual_open_datetime),
      is_active: bool(row.is_active),
      note: emptyToNull(row.note),
    }

    if (dryRun) continue

    if (existing?.id) {
      const { error } = await supabase.from('booking_policies').update(payload).eq('id', existing.id)
      if (error) throw error
      updates++
    } else {
      const { error } = await supabase.from('booking_policies').insert(payload)
      if (error) throw error
      inserts++
    }
  }

  console.log(JSON.stringify({ dryRun, count: rows.length, updates, inserts, skipsNoCourse }, null, 2))
}

main().catch((err) => {
  console.error('[staging-upsert-policies-20] failed:', err)
  process.exit(1)
})
