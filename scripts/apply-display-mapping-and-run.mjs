import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templatesDir = path.resolve(__dirname, '..', 'data', 'templates')
const mappingFile = path.resolve(process.cwd(), 'data', 'mappings', 'manual_display_name_map.csv')
const outDir = path.resolve(process.cwd(), 'tmp', 'mapped_templates')

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

function normalizeForCompare(s) {
  if (!s) return ''
  return String(s)
    .normalize('NFKC')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/[㈱㈜]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(g\.c\.|gc|c\.c\.|cc|컨트리클럽|컨트리구락부|골프클럽|골프장|회원제|대중제|퍼블릭|리조트|호텔|주식회사|주)\b/gi, '')
    .replace(/["',.`··•···\-_/&()]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase()
    .trim()
}

function writeCsv(rows, filePath) {
  if (!rows || !rows.length) return
  const headers = Object.keys(rows[0])
  // write header without additional quoting so downstream parsers that split on comma work
  const lines = [headers.join(',')]
  for (const r of rows) {
    lines.push(headers.map((h) => esc(r[h])).join(','))
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8')
}

async function main() {
  if (!fs.existsSync(templatesDir)) {
    console.error('[apply-display-mapping] templates dir not found:', templatesDir)
    process.exit(1)
  }
  if (!fs.existsSync(mappingFile)) {
    console.error('[apply-display-mapping] mapping file not found:', mappingFile)
    process.exit(1)
  }

  const coursesFile = path.join(templatesDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(templatesDir, 'booking_policies_20_template.csv')

  const mappingRows = parseCsv(mappingFile)
  const mapping = new Map()
  const mappingNorm = new Map()
  for (const r of mappingRows) {
    const input = (r.input_name || '').trim()
    const target = (r.staging_name || '').trim()
    if (!input || !target) continue
    mapping.set(input, target)
    mappingNorm.set(normalizeForCompare(input), target)
  }

  const courses = parseCsv(coursesFile)
  const newCourses = courses.map((row) => {
    const name = (row.name || '').trim()
    if (mapping.has(name)) {
      return { ...row, name: mapping.get(name) }
    }
    const n = normalizeForCompare(name)
    if (mappingNorm.has(n)) {
      return { ...row, name: mappingNorm.get(n) }
    }
    return row
  })

  // write new templates
  const outCourses = path.join(outDir, 'golf_courses_20_template.csv')
  const outPolicies = path.join(outDir, 'booking_policies_20_template.csv')
  writeCsv(newCourses, outCourses)
  // copy policies file unchanged
  fs.mkdirSync(outDir, { recursive: true })
  fs.copyFileSync(policiesFile, outPolicies)
  console.log('[apply-display-mapping] wrote mapped templates to', outDir)

  // prepare env: load .env.local if exists
  const dotenvPath = path.resolve(process.cwd(), '.env.local')
  const childEnv = { ...process.env }
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

  // run realistic-dry-run in child process
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

  console.log('[apply-display-mapping] realistic-dry-run finished')
}

main().catch((e) => {
  console.error('[apply-display-mapping] error', e)
  process.exit(1)
})
