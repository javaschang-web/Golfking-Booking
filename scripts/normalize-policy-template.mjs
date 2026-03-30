import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.resolve(__dirname, '..', 'data', 'templates')
const inFile = path.join(templatesDir, 'booking_policies_20_template.csv')
const outFile = path.join(templatesDir, 'booking_policies_20_template.csv')

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
  return {
    headers,
    rows: lines
      .slice(1)
      .filter(Boolean)
      .map((line) => {
        const cols = splitCsvLine(line)
        const row = {}
        headers.forEach((header, i) => {
          row[header] = (cols[i] ?? '').replace(/^"|"$/g, '')
        })
        return row
      }),
  }
}

function esc(v) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

function writeCsv(headers, rows, filePath) {
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','))
  }
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
}

function normalizeTime(t) {
  if (!t) return ''
  const s = String(t).trim()
  let m = s.match(/^(\d{1,2}):(\d{2}):(\d{2})$/)
  if (m) return `${String(m[1]).padStart(2, '0')}:${m[2]}:${m[3]}`
  m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (m) return `${String(m[1]).padStart(2, '0')}:${m[2]}:00`
  m = s.match(/(\d{1,2})\s*시\s*(\d{1,2})?/) // e.g., 9시 / 9시30
  if (m) {
    const hh = String(m[1]).padStart(2, '0')
    const mm = m[2] ? String(m[2]).padStart(2, '0') : '00'
    return `${hh}:${mm}:00`
  }
  return s
}

function normalizeInt(v) {
  if (v === undefined || v === null) return ''
  const s = String(v).trim()
  if (!s) return ''
  const n = parseInt(s.replace(/[^0-9-]/g, ''), 10)
  return Number.isNaN(n) ? '' : String(n)
}

const weekdayMap = { 월: '1', 화: '2', 수: '3', 목: '4', 금: '5', 토: '6', 일: '7' }
function parseWeekday(text) {
  const m = String(text || '').match(/(월요일|화요일|수요일|목요일|금요일|토요일|일요일|월\b|화\b|수\b|목\b|금\b|토\b|일\b)/)
  if (!m) return ''
  return weekdayMap[m[1][0]] || ''
}

function parseDaysLowerBound(text) {
  const s = String(text || '')
  let m = s.match(/(\d{1,2})\s*일\s*전/) || s.match(/(\d{1,2})일전/)
  if (m) return String(parseInt(m[1], 10))
  // 8~9주 전 -> pick lower bound 8
  m = s.match(/(\d{1,2})(?:\s*[~〜\-–]\s*(\d{1,2}))?\s*주\s*(?:전)?/)
  if (m) {
    const low = parseInt(m[1], 10)
    if (!Number.isNaN(low)) return String(low * 7)
  }
  return ''
}

function parseTime(text) {
  const s = String(text || '')
  const m = s.match(/(\d{1,2}:\d{2}(?::\d{2})?)/)
  if (m) return normalizeTime(m[1])
  const m2 = s.match(/(\d{1,2})\s*시\s*(\d{1,2})?/) 
  if (m2) return normalizeTime(m2[0])
  return ''
}

function normalizeBool(v) {
  const s = String(v ?? '').trim().toLowerCase()
  if (s === 'true' || s === 'false') return s
  if (s === '1') return 'true'
  if (s === '0') return 'false'
  return s
}

if (!fs.existsSync(inFile)) {
  console.error('[normalize-policy-template] missing:', inFile)
  process.exit(1)
}

const { headers, rows } = parseCsv(inFile)

let filledDays = 0
let filledWeekday = 0
let filledTime = 0

const outRows = rows.map((r) => {
  const src = `${r.source_text || ''} ${r.policy_summary || ''} ${r.note || ''}`.replace(/\s+/g, ' ').trim()

  const out = { ...r }

  // normalize existing fields
  out.days_before_open = normalizeInt(out.days_before_open)
  out.open_weekday = normalizeInt(out.open_weekday)
  out.open_time = out.open_time ? normalizeTime(out.open_time) : ''
  out.monthly_open_day = normalizeInt(out.monthly_open_day)
  out.monthly_offset_months = normalizeInt(out.monthly_offset_months)
  out.is_active = normalizeBool(out.is_active)

  // fill missing from text (lower bound strategy)
  if (!out.days_before_open) {
    const d = parseDaysLowerBound(src)
    if (d) {
      out.days_before_open = d
      filledDays++
    }
  }
  if (!out.open_weekday) {
    const w = parseWeekday(src)
    if (w) {
      out.open_weekday = w
      filledWeekday++
    }
  }
  if (!out.open_time) {
    const t = parseTime(src)
    if (t) {
      out.open_time = t
      filledTime++
    }
  }

  return out
})

writeCsv(headers, outRows, outFile)
console.log('[normalize-policy-template] wrote:', outFile)
console.log('[normalize-policy-template] filled:', { filledDays, filledWeekday, filledTime, total: rows.length })
