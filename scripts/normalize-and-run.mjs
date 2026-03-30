import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.resolve(__dirname, '..', 'data', 'templates')
const outDir = path.resolve(process.cwd(), 'tmp', 'normalized_templates')

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

function normalizeNameDisplay(s) {
  if (!s) return ''
  return String(s)
    .normalize('NFKC')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[㈱㈜]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(g\.c\.|gc|c\.c\.|cc|컨트리클럽|컨트리구락부|골프클럽|골프장|회원제|대중제|퍼블릭|리조트|호텔|주식회사|주)\b/gi, '')
    .replace(/["',.`··•···\-_/&()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function writeCsv(rows, filePath) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  const lines = [headers.map(esc).join(',')]
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','))
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
}

async function run() {
  if (!fs.existsSync(templatesDir)) {
    console.error('[normalize-and-run] templates dir not found:', templatesDir)
    process.exit(1)
  }

  const coursesFile = path.join(templatesDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(templatesDir, 'booking_policies_20_template.csv')

  if (!fs.existsSync(coursesFile) || !fs.existsSync(policiesFile)) {
    console.error('[normalize-and-run] template files missing')
    process.exit(1)
  }

  const courses = parseCsv(coursesFile)
  const policies = parseCsv(policiesFile)

  // normalize course names
  const normalizedCourses = courses.map((r) => ({ ...r, name: normalizeNameDisplay(r.name) }))

  // write normalized templates
  const outCourses = path.join(outDir, 'golf_courses_20_template.csv')
  const outPolicies = path.join(outDir, 'booking_policies_20_template.csv')
  writeCsv(normalizedCourses, outCourses)
  writeCsv(policies, outPolicies)

  console.log('[normalize-and-run] wrote normalized templates to', outDir)

  // run realistic-dry-run with TEMPLATES_DIR env override
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, 'realistic-dry-run.mjs')], {
      env: { ...process.env, TEMPLATES_DIR: outDir },
      stdio: 'inherit'
    })
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error('realistic-dry-run exited with code ' + code))
    })
  })

  console.log('[normalize-and-run] realistic-dry-run finished')
}

run().catch((e) => {
  console.error('[normalize-and-run] error', e)
  process.exit(1)
})
