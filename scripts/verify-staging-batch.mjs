import fs from 'node:fs'
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

const inputArgIndex = process.argv.indexOf('--input-json')
const reportArgIndex = process.argv.indexOf('--report-prefix')
const resultPath = inputArgIndex >= 0 ? process.argv[inputArgIndex + 1] : 'C:/Users/javas/.openclaw/workspace-javes/reports/staging_pilot20_apply_result.json'
const reportPrefix = reportArgIndex >= 0 ? process.argv[reportArgIndex + 1] : 'staging_pilot20'

const env = loadEnvFile('.env.local')
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const applied = JSON.parse(fs.readFileSync(resultPath, 'utf8')).results
const slugs = applied.map((r) => r.slug)

const { data: courses, error: courseError } = await supabase
  .from('golf_courses')
  .select('id,slug,name,address,region_primary,region_secondary,membership_required')
  .in('slug', slugs)
if (courseError) throw courseError

const ids = courses.map((c) => c.id)

const notePrefix = reportPrefix.replace(/_/g, ' ')

const { data: sources, error: sourceError } = await supabase
  .from('source_records')
  .select('id,golf_course_id,note')
  .in('golf_course_id', ids)
  .like('note', `${notePrefix}%`)
if (sourceError) throw sourceError

const { data: logs, error: logError } = await supabase
  .from('change_logs')
  .select('id,entity_id,note')
  .in('entity_id', ids)
  .like('note', `${notePrefix}%`)
if (logError) throw logError

const byIdSources = new Map()
for (const s of sources) byIdSources.set(s.golf_course_id, (byIdSources.get(s.golf_course_id) || 0) + 1)
const byIdLogs = new Map()
for (const l of logs) byIdLogs.set(l.entity_id, (byIdLogs.get(l.entity_id) || 0) + 1)

const verification = applied.map((item) => {
  const course = courses.find((c) => c.slug === item.slug)
  return {
    slug: item.slug,
    expected_action: item.action,
    exists: Boolean(course),
    source_records_added: course ? (byIdSources.get(course.id) || 0) : 0,
    change_logs_added: course ? (byIdLogs.get(course.id) || 0) : 0,
  }
})

const summary = {
  requested: applied.length,
  found_courses: verification.filter((v) => v.exists).length,
  source_records_added_total: sources.length,
  change_logs_added_total: logs.length,
  missing_courses: verification.filter((v) => !v.exists).map((v) => v.slug),
  missing_source_records: verification.filter((v) => v.exists && v.source_records_added === 0).map((v) => v.slug),
  missing_change_logs: verification.filter((v) => v.exists && v.change_logs_added === 0).map((v) => v.slug),
}

fs.writeFileSync(`C:/Users/javas/.openclaw/workspace-javes/reports/${reportPrefix}_verify.json`, JSON.stringify({ summary, verification }, null, 2))
console.log(JSON.stringify(summary, null, 2))
