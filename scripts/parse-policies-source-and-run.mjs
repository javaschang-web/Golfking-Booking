import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mappedDir = path.resolve(process.cwd(), 'tmp', 'mapped_templates')
const policiesNormDir = path.resolve(process.cwd(), 'tmp', 'policies_normalized_templates')
const defaultTemplatesDir = path.resolve(__dirname, '..', 'data', 'templates')

// prefer mapped templates (if names were adjusted), then policies_normalized, then default
const baseDir = fs.existsSync(path.join(mappedDir, 'golf_courses_20_template.csv'))
  ? mappedDir
  : fs.existsSync(path.join(policiesNormDir, 'booking_policies_20_template.csv'))
  ? policiesNormDir
  : defaultTemplatesDir

const outDir = path.resolve(process.cwd(), 'tmp', 'policies_parsed_templates')

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

function esc(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

function writeCsv(rows, filePath) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','))
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
}

function normalizeTime(t) {
  if (!t) return ''
  const s = String(t).trim()
  let m = s.match(/(\d{1,2}):(\d{2}):(\d{2})/)
  if (m) return `${String(m[1]).padStart(2,'0')}:${m[2]}:${m[3]}`
  m = s.match(/(\d{1,2}):(\d{2})/)
  if (m) return `${String(m[1]).padStart(2,'0')}:${m[2]}:00`
  // match like '09:00시' or '09시'
  m = s.match(/(\d{1,2})\s*시\s*(\d{1,2})?/)
  if (m) {
    const hh = String(m[1]).padStart(2,'0')
    const mm = m[2] ? String(m[2]).padStart(2,'0') : '00'
    return `${hh}:${mm}:00`
  }
  // match 900 or 0900
  m = s.match(/\b(\d{3,4})\b/)
  if (m) {
    const v = m[1]
    if (v.length === 3) return `${String(v.slice(0,1)).padStart(2,'0')}:${v.slice(1)}:00`
    if (v.length === 4) return `${v.slice(0,2)}:${v.slice(2)}:00`
  }
  return ''
}

function parseDays(text) {
  if (!text) return ''
  // look for explicit days like '20일 전' or '20일전' or '20일'
  let m = text.match(/(\d{1,2})\s*일\s*전/) || text.match(/(\d{1,2})일전/) || text.match(/(\d{1,2})\s*일\b/)
  if (m) return String(parseInt(m[1], 10))
  // look for weeks like '3주 전' or '3주전' or '3주' or '8~9주 전'
  m = text.match(/(\d{1,2})(?:\s*[~〜\-–]\s*(\d{1,2}))?\s*주\s*(?:전)?/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (!Number.isNaN(n)) return String(n * 7)
  }
  return ''
}

function parseWeekday(text) {
  if (!text) return ''
  const map = { 월: '1', 화: '2', 수: '3', 목: '4', 금: '5', 토: '6', 일: '7' }
  const m = text.match(/(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월\b|화\b|수\b|목\b|금\b|토\b|일\b)/)
  if (m) {
    const w = m[1]
    const short = w[0]
    return map[short] || ''
  }
  return ''
}

async function main() {
  const coursesFile = path.join(baseDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(baseDir, 'booking_policies_20_template.csv')

  if (!fs.existsSync(coursesFile) || !fs.existsSync(policiesFile)) {
    console.error('[parse-policies] required template files missing in', baseDir)
    process.exit(1)
  }

  const courses = parseCsv(coursesFile)
  const policies = parseCsv(policiesFile)

  const updated = policies.map((row) => {
    const src = ((row.source_text || '') + ' ' + (row.policy_summary || '') + ' ' + (row.note || '')).replace(/\s+/g, ' ').trim()

    const out = { ...row }

    // days_before_open
    if (!out.days_before_open || String(out.days_before_open).trim() === '') {
      const parsed = parseDays(src)
      if (parsed) out.days_before_open = parsed
    }

    // open_weekday
    if (!out.open_weekday || String(out.open_weekday).trim() === '') {
      const parsed = parseWeekday(src)
      if (parsed) out.open_weekday = parsed
    }

    // open_time
    if (!out.open_time || String(out.open_time).trim() === '') {
      const parsed = normalizeTime(src)
      if (parsed) out.open_time = parsed
    }

    // monthly_open_day
    if (!out.monthly_open_day || String(out.monthly_open_day).trim() === '') {
      const m = src.match(/매월\s*(\d{1,2})\s*일/) || src.match(/(\d{1,2})\s*일\s*오픈/)
      if (m) out.monthly_open_day = String(parseInt(m[1], 10))
    }

    // normalize is_active to 'true'/'false' if possible
    if (out.is_active !== undefined && out.is_active !== null) {
      const s = String(out.is_active).trim().toLowerCase()
      if (s === 'true' || s === 'false') out.is_active = s
      else if (s === '1') out.is_active = 'true'
      else if (s === '0') out.is_active = 'false'
    }

    return out
  })

  // write out
  const outCourses = path.join(outDir, 'golf_courses_20_template.csv')
  const outPolicies = path.join(outDir, 'booking_policies_20_template.csv')
  writeCsv(courses, outCourses)
  writeCsv(updated, outPolicies)
  console.log('[parse-policies] wrote parsed templates to', outDir)

  // prepare env for child process (load .env.local)
  const childEnv = { ...process.env }
  const dotenvPath = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(dotenvPath)) {
    const raw = fs.readFileSync(dotenvPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || /^\s*#/.test(line)) continue
      const idx = line.indexOf('=')
      if (idx === -1) continue
      const k = line.slice(0, idx).trim()
      const v = line.slice(idx + 1)
      childEnv[k] = v
    }
  }
  childEnv.TEMPLATES_DIR = outDir

  // run realistic-dry-run
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'realistic-dry-run.mjs')], {
      env: childEnv,
      stdio: 'inherit'
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error('realistic-dry-run exited with code ' + code))
    })
  })

  console.log('[parse-policies] realistic-dry-run finished')
}

main().catch((e) => {
  console.error('[parse-policies] error', e)
  process.exit(1)
})
