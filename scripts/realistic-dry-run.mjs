import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Allow overriding templates directory via environment variable (useful for normalized test runs)
const baseDir = process.env.TEMPLATES_DIR
  ? path.resolve(process.cwd(), process.env.TEMPLATES_DIR)
  : path.resolve(__dirname, '..', 'data', 'templates')

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

function normalizeForCompare(s) {
  // Normalize string for comparison: NFKC, remove corporate markers and common suffixes,
  // remove punctuation and whitespace, lowercase.
  if (!s) return ''
  return String(s)
    .normalize('NFKC')
    .replace(/[\uFEFF\u200B]/g, '') // BOM/zero-width
    .replace(/[㈱㈜]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(g\.c\.|gc|c\.c\.|cc|컨트리클럽|컨트리구락부|골프클럽|골프장|회원제|대중제|퍼블릭|리조트|호텔|주식회사|주)\b/gi, '')
    .replace(/["',.`··•···\-_/&()]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim()
}

async function main() {
  // load env from .env.local if present, but do not print
  try {
    const dotenvPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(dotenvPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      ;(await import('dotenv')).config({ path: dotenvPath })
    }
  } catch (e) {
    // ignore
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[realistic-dry-run] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local or process.env)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('[realistic-dry-run] fetching existing golf_courses and booking_policies from staging')
  const { data: courses, error: coursesErr } = await supabase
    .from('golf_courses')
    .select(`id, slug, name, region_primary, region_secondary, address, phone, booking_note`)

  if (coursesErr) {
    console.error('[realistic-dry-run] failed to fetch golf_courses:', coursesErr.message)
    process.exit(1)
  }

  const { data: policies, error: policiesErr } = await supabase
    .from('booking_policies')
    .select(`id, golf_course_id, policy_type, days_before_open, open_weekday, open_time, monthly_open_day, manual_open_datetime, is_active, policy_summary`)

  if (policiesErr) {
    console.error('[realistic-dry-run] failed to fetch booking_policies:', policiesErr.message)
    process.exit(1)
  }

  const courseMap = new Map()
  for (const c of courses) {
    courseMap.set(c.slug, c)
  }

  const policiesByCourse = new Map()
  for (const p of policies) {
    const arr = policiesByCourse.get(p.golf_course_id) ?? []
    arr.push(p)
    policiesByCourse.set(p.golf_course_id, arr)
  }

  // load templates (20-sample files)
  const coursesFile = path.join(baseDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(baseDir, 'booking_policies_20_template.csv')

  if (!fs.existsSync(coursesFile) || !fs.existsSync(policiesFile)) {
    console.error('[realistic-dry-run] template files not found in data/templates')
    process.exit(1)
  }

  const importCourses = parseCsv(coursesFile)
  const importPolicies = parseCsv(policiesFile)

  // Map policies per course slug
  const importPoliciesBySlug = new Map()
  for (const p of importPolicies) {
    const slug = p.course_slug
    if (!importPoliciesBySlug.has(slug)) importPoliciesBySlug.set(slug, [])
    importPoliciesBySlug.get(slug).push(p)
  }

  const report = {
    timestamp: new Date().toISOString(),
    courses_total: importCourses.length,
    courses_inserts: [],
    courses_updates: [],
    courses_no_change: [],
    policy_inserts: [],
    policy_conflicts: [],
    name_mismatches: [],
  }

  for (const row of importCourses) {
    const slug = row.slug
    const existing = courseMap.get(slug)
    if (!existing) {
      report.courses_inserts.push({ slug, name: row.name })
      continue
    }

    const diffs = []
    // compare key fields; for name we use a normalized comparison to avoid surface-level suffix/format differences
    const ignoreFields = new Set(
      String(process.env.REALISTIC_DRY_RUN_IGNORE_FIELDS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    )
    const fieldsToCheck = ['name', 'region_primary', 'region_secondary', 'address', 'phone', 'booking_note'].filter(
      (f) => !ignoreFields.has(f)
    )
    for (const f of fieldsToCheck) {
      const incoming = emptyToNull(row[f])
      const current = emptyToNull(existing[f])
      if (f === 'name') {
        const inNorm = normalizeForCompare(incoming ?? '')
        const curNorm = normalizeForCompare(current ?? '')
        if (inNorm !== curNorm) {
          diffs.push({ field: f, current: current ?? null, incoming: incoming ?? null })
        }
      } else {
        if ((incoming || '') !== (current || '')) {
          diffs.push({ field: f, current: current ?? null, incoming: incoming ?? null })
        }
      }
    }

    if (diffs.length === 0) {
      report.courses_no_change.push({ slug })
    } else {
      report.courses_updates.push({ slug, diffs })
      // check for name mismatch specifically using normalized comparison
      const incomingName = String(row.name ?? '').trim()
      const currentName = String(existing.name ?? '').trim()
      const inNorm = normalizeForCompare(incomingName)
      const curNorm = normalizeForCompare(currentName)
      if (incomingName && currentName && inNorm !== curNorm) {
        report.name_mismatches.push({ slug, currentName, incomingName })
      }
    }

    // policies - compare by policy_type
    const importedForCourse = importPoliciesBySlug.get(slug) ?? []
    const existingPolicies = policiesByCourse.get(existing.id) ?? []
    const existingByType = new Map(existingPolicies.map((p) => [p.policy_type, p]))

    for (const imp of importedForCourse) {
      const type = imp.policy_type
      const matched = existingByType.get(type)
      if (!matched) {
        report.policy_inserts.push({ slug, policy_type: type })
      } else {
        // quick compare summary of numeric/text fields
        const fields = ['days_before_open', 'open_weekday', 'open_time', 'monthly_open_day', 'manual_open_datetime']
        let same = true
        for (const f of fields) {
          const a = emptyToNull(imp[f])
          const b = emptyToNull(matched[f])
          if ((String(a || '') !== String(b || ''))) {
            same = false
            break
          }
        }
        if (!same) report.policy_conflicts.push({ slug, policy_type: type, existing: matched, incoming: imp })
      }
    }
  }

  const outDir = path.resolve(process.cwd(), 'reports')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)

  const outPath = path.join(outDir, 'staging_realistic_dry_run.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8')
  console.log('[realistic-dry-run] report written to', outPath)

  // name mismatch details to human-friendly markdown
  const mm = report.name_mismatches
  const md = [
    '# Name mismatch report\n',
    `Generated: ${new Date().toISOString()}\n`,
    '## Summary\n',
    `Total mismatches: ${mm.length}\n\n`,
    '## Details\n',
  ]
  for (const m of mm) {
    md.push(`- slug: ${m.slug}\n  - current: ${m.currentName}\n  - incoming: ${m.incomingName}\n\n`)
  }

  fs.writeFileSync(path.join(outDir, 'name_mismatch_report.md'), md.join('\n'), 'utf8')
  console.log('[realistic-dry-run] name mismatch markdown written to reports/name_mismatch_report.md')

  console.log('[realistic-dry-run] done')
}

main().catch((err) => {
  console.error('[realistic-dry-run] unexpected error', err)
  process.exit(1)
})
