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

const dryRun = process.argv.includes('--dry-run')
const env = loadEnvFile('.env.local')
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const candidateSlugs = [
  'course', 'c-c', 'g-c', '경기-1-2-3', '경기-9', '경기-88', '경기-300', 'j-public', 'ku', 'seaside', 'q',
]

const { data: courses, error: courseError } = await supabase
  .from('golf_courses')
  .select('*')
  .in('slug', candidateSlugs)
if (courseError) throw courseError

const courseIds = courses.map((c) => c.id)

const { data: sources, error: sourceError } = await supabase
  .from('source_records')
  .select('*')
  .in('golf_course_id', courseIds)
if (sourceError) throw sourceError

const { data: logs, error: logError } = await supabase
  .from('change_logs')
  .select('*')
  .in('entity_id', courseIds)
if (logError) throw logError

const backup = {
  createdAt: new Date().toISOString(),
  dryRun,
  candidateSlugs,
  courses,
  source_records: sources,
  change_logs: logs,
}

fs.mkdirSync('C:/Users/javas/.openclaw/workspace-javes/backups', { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
const backupPath = `C:/Users/javas/.openclaw/workspace-javes/backups/staging_batch100_cleanup_${stamp}.json`
fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))

if (!dryRun && courseIds.length > 0) {
  const { error: deleteLogsError } = await supabase.from('change_logs').delete().in('entity_id', courseIds)
  if (deleteLogsError) throw deleteLogsError

  const { error: deleteSourcesError } = await supabase.from('source_records').delete().in('golf_course_id', courseIds)
  if (deleteSourcesError) throw deleteSourcesError

  const { error: deleteCoursesError } = await supabase.from('golf_courses').delete().in('id', courseIds)
  if (deleteCoursesError) throw deleteCoursesError
}

console.log(JSON.stringify({
  dryRun,
  backupPath,
  courses_found: courses.length,
  source_records_found: sources.length,
  change_logs_found: logs.length,
  deleted_courses: dryRun ? 0 : courses.length,
}, null, 2))
