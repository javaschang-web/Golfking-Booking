import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mappedDir = path.resolve(process.cwd(), 'tmp', 'mapped_templates')
const defaultTemplatesDir = path.resolve(__dirname, '..', 'data', 'templates')
const baseDir = fs.existsSync(path.join(mappedDir, 'golf_courses_20_template.csv')) ? mappedDir : defaultTemplatesDir
const outDir = path.resolve(process.cwd(), 'tmp', 'policies_normalized_templates')

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
  // If already HH:MM:SS
  let m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (m) {
    const hh = String(m[1]).padStart(2, '0')
    const mm = m[2]
    const ss = m[3]
    return `${hh}:${mm}:${ss}`
  }
  // If HH:MM
  m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    const hh = String(m[1]).padStart(2, '0')
    const mm = m[2]
    return `${hh}:${mm}:00`
  }
  // If HMM or numeric like 900 -> 09:00:00
  m = s.match(/^(\d{1,4})$/)
  if (m) {
    const v = m[1]
    if (v.length <= 2) {
      const hh = String(v).padStart(2, '0')
      return `${hh}:00:00`
    }
    if (v.length === 3) {
      const hh = v.slice(0,1).padStart(2,'0')
      const mm = v.slice(1)
      return `${hh}:${mm}:00`
    }
    if (v.length === 4) {
      const hh = v.slice(0,2)
      const mm = v.slice(2)
      return `${hh}:${mm}:00`
    }
  }
  // fallback: return original trimmed
  return s
}

function normalizeIntField(v) {
  if (v === undefined || v === null) return ''
  const s = String(v).trim()
  if (s === '') return ''
  const num = parseInt(s.replace(/[^0-9-]/g, ''), 10)
  if (Number.isNaN(num)) return ''
  return String(num)
}

async function main() {
  const coursesFile = path.join(baseDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(baseDir, 'booking_policies_20_template.csv')

  if (!fs.existsSync(coursesFile) || !fs.existsSync(policiesFile)) {
    console.error('[normalize-policies] required template files missing in', baseDir)
    process.exit(1)
  }

  const courses = parseCsv(coursesFile)
  const policies = parseCsv(policiesFile)

  const normalizedPolicies = policies.map((r) => {
    return {
      ...r,
      days_before_open: normalizeIntField(r.days_before_open),
      open_weekday: normalizeIntField(r.open_weekday),
      open_time: normalizeTime(r.open_time),
      monthly_open_day: normalizeIntField(r.monthly_open_day),
      manual_open_datetime: (r.manual_open_datetime || '').trim(),
      is_active: (r.is_active || '').toString().trim(),
    }
  })

  // write out normalized templates
  const outCourses = path.join(outDir, 'golf_courses_20_template.csv')
  const outPolicies = path.join(outDir, 'booking_policies_20_template.csv')
  writeCsv(courses, outCourses)
  writeCsv(normalizedPolicies, outPolicies)
  console.log('[normalize-policies] wrote normalized policies to', outDir)

  // prepare child env including .env.local values
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

  console.log('[normalize-policies] realistic-dry-run finished')
}

main().catch((e) => {
  console.error('[normalize-policies] error', e)
  process.exit(1)
})
