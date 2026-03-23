import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const baseDir = process.argv[2] || path.resolve('data', 'templates')
const dryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = !dryRun
  ? (() => {
      if (!supabaseUrl || !serviceRoleKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
        process.exit(1)
      }

      return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    })()
  : null

async function main() {
  console.log(`[bulk-import] baseDir=${baseDir}`)
  console.log(`[bulk-import] mode=${dryRun ? 'dry-run' : 'apply'}`)

  const courses = parseCsv(path.join(baseDir, 'golf_courses_sample.csv'))
  const policies = parseCsv(path.join(baseDir, 'booking_policies_sample.csv'))
  const sources = parseCsv(path.join(baseDir, 'source_records_sample.csv'))

  validateCourses(courses)
  validatePolicies(policies)
  validateSources(sources)
  printSummary(courses, policies, sources)

  if (dryRun) {
    console.log('[bulk-import] validation passed (no DB writes performed)')
    return
  }

  await importCourses(courses)
  await importPolicies(policies)
  await importSources(sources)

  console.log('[bulk-import] done')
}

function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').trim()
  const lines = raw.split(/\r?\n/)
  const headers = lines[0].split(',')
  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = splitCsvLine(line)
    const row = {}
    headers.forEach((header, i) => {
      row[header] = cols[i] ?? ''
    })
    return row
  })
}

function splitCsvLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
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

function validateCourses(rows) {
  ensureUnique(rows.map((row) => row.slug), 'courses.slug')

  for (const [index, row] of rows.entries()) {
    if (!row.slug || !row.name || !row.region_primary) {
      throw new Error(`[courses:${index + 1}] missing required slug/name/region_primary`)
    }
  }
}

function validatePolicies(rows) {
  ensureUnique(rows.map((row) => `${row.course_slug}:${row.policy_type}:${row.policy_summary}`), 'policies composite key')

  for (const [index, row] of rows.entries()) {
    if (!row.course_slug || !row.policy_type) {
      throw new Error(`[policies:${index + 1}] missing required course_slug/policy_type`)
    }
  }
}

function validateSources(rows) {
  for (const [index, row] of rows.entries()) {
    if (!row.course_slug || !row.source_type) {
      throw new Error(`[sources:${index + 1}] missing required course_slug/source_type`)
    }
  }
}

function ensureUnique(values, label) {
  const seen = new Set()
  for (const value of values) {
    if (!value) continue
    if (seen.has(value)) {
      throw new Error(`[validation] duplicate detected in ${label}: ${value}`)
    }
    seen.add(value)
  }
}

function printSummary(courses, policies, sources) {
  const courseRegions = [...new Set(courses.map((row) => row.region_primary).filter(Boolean))]
  const policyTypes = [...new Set(policies.map((row) => row.policy_type).filter(Boolean))]
  const sourceTypes = [...new Set(sources.map((row) => row.source_type).filter(Boolean))]

  console.log(`[bulk-import] courses=${courses.length}, policies=${policies.length}, sources=${sources.length}`)
  console.log(`[bulk-import] regions=${courseRegions.join(', ') || '-'}`)
  console.log(`[bulk-import] policyTypes=${policyTypes.join(', ') || '-'}`)
  console.log(`[bulk-import] sourceTypes=${sourceTypes.join(', ') || '-'}`)
}

async function importCourses(rows) {
  for (const row of rows) {
    const payload = {
      slug: row.slug,
      name: row.name,
      english_name: emptyToNull(row.english_name),
      region_primary: row.region_primary,
      region_secondary: emptyToNull(row.region_secondary),
      address: emptyToNull(row.address),
      phone: emptyToNull(row.phone),
      homepage_url: emptyToNull(row.homepage_url),
      booking_url: emptyToNull(row.booking_url),
      map_url: emptyToNull(row.map_url),
      membership_required: bool(row.membership_required),
      membership_note: emptyToNull(row.membership_note),
      booking_note: emptyToNull(row.booking_note),
      status: row.status || 'active',
      verification_status: row.verification_status || 'draft',
    }

    const { error } = await supabase.from('golf_courses').upsert(payload, { onConflict: 'slug' })
    if (error) throw error
    console.log(`[courses] upsert ${row.slug}`)
  }
}

async function importPolicies(rows) {
  for (const row of rows) {
    const { data: course, error: courseError } = await supabase
      .from('golf_courses')
      .select('id')
      .eq('slug', row.course_slug)
      .single()

    if (courseError) throw courseError

    const payload = {
      golf_course_id: course.id,
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

    const { error } = await supabase.from('booking_policies').insert(payload)
    if (error) throw error
    console.log(`[policies] insert ${row.course_slug}:${row.policy_type}`)
  }
}

async function importSources(rows) {
  for (const row of rows) {
    const { data: course, error: courseError } = await supabase
      .from('golf_courses')
      .select('id')
      .eq('slug', row.course_slug)
      .single()

    if (courseError) throw courseError

    let booking_policy_id = null
    if (row.policy_type) {
      const { data: policy } = await supabase
        .from('booking_policies')
        .select('id')
        .eq('golf_course_id', course.id)
        .eq('policy_type', row.policy_type)
        .limit(1)
        .maybeSingle()
      booking_policy_id = policy?.id ?? null
    }

    const payload = {
      golf_course_id: course.id,
      booking_policy_id,
      source_type: row.source_type,
      source_url: emptyToNull(row.source_url),
      source_title: emptyToNull(row.source_title),
      captured_text: emptyToNull(row.captured_text),
      is_current: bool(row.is_current),
      note: emptyToNull(row.note),
    }

    const { error } = await supabase.from('source_records').insert(payload)
    if (error) throw error
    console.log(`[sources] insert ${row.course_slug}:${row.source_type}`)
  }
}

main().catch((error) => {
  console.error('[bulk-import] failed:', error)
  process.exit(1)
})
