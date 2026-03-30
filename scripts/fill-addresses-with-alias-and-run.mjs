import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = process.cwd()

const outDir = path.resolve(workspaceRoot, 'tmp', 'address_filled_templates_v2')

// Prefer mapped templates (name fixed) if present; else use default templates
const mappedDir = path.resolve(workspaceRoot, 'tmp', 'mapped_templates')
const templatesDir = fs.existsSync(path.join(mappedDir, 'golf_courses_20_template.csv'))
  ? mappedDir
  : path.resolve(__dirname, '..', 'data', 'templates')

const bulkPath = path.resolve(workspaceRoot, 'data', 'bulk_import_ready.csv')
const aliasPath = path.resolve(workspaceRoot, 'data', 'mappings', 'manual_bulk_name_alias_map.csv')

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

function normalizeKey(s) {
  if (!s) return ''
  return String(s)
    .normalize('NFKC')
    .replace(/[\uFEFF\u200B]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\"\\,.'`·•]/g, '')
    .toLowerCase()
    .trim()
}

async function main() {
  const coursesFile = path.join(templatesDir, 'golf_courses_20_template.csv')
  const policiesFile = path.join(templatesDir, 'booking_policies_20_template.csv')

  if (!fs.existsSync(coursesFile) || !fs.existsSync(policiesFile)) {
    console.error('[fill-addresses-v2] templates missing in', templatesDir)
    process.exit(1)
  }
  if (!fs.existsSync(bulkPath)) {
    console.error('[fill-addresses-v2] bulk_import_ready.csv missing at', bulkPath)
    process.exit(1)
  }

  const courses = parseCsv(coursesFile)
  const policies = parseCsv(policiesFile)
  const bulk = parseCsv(bulkPath)

  const addrByNameNorm = new Map()
  for (const r of bulk) {
    const nn = (r.name_norm || normalizeKey(r.name)).trim()
    const addr = (r.addr || '').trim()
    if (!nn || !addr) continue
    if (!addrByNameNorm.has(nn)) addrByNameNorm.set(nn, addr)
  }

  // slug -> bulk_name alias
  const aliasBySlug = new Map()
  if (fs.existsSync(aliasPath)) {
    const aliases = parseCsv(aliasPath)
    for (const a of aliases) {
      const slug = String(a.slug || '').trim()
      const bulkName = String(a.bulk_name || '').trim()
      if (slug && bulkName) aliasBySlug.set(slug, bulkName)
    }
  }

  let filled = 0
  let already = 0
  let missing = 0
  let filledByAlias = 0

  const newCourses = courses.map((r) => {
    const curAddr = (r.address || '').trim()
    if (curAddr) {
      already++
      return r
    }

    const aliasName = aliasBySlug.get(String(r.slug || '').trim())
    const keys = [normalizeKey(r.name)]
    if (aliasName) keys.unshift(normalizeKey(aliasName))

    for (const k of keys) {
      const addr = addrByNameNorm.get(k)
      if (addr) {
        filled++
        if (aliasName && k === normalizeKey(aliasName)) filledByAlias++
        return { ...r, address: addr }
      }
    }

    missing++
    return r
  })

  fs.mkdirSync(outDir, { recursive: true })
  writeCsv(newCourses, path.join(outDir, 'golf_courses_20_template.csv'))
  writeCsv(policies, path.join(outDir, 'booking_policies_20_template.csv'))

  console.log('[fill-addresses-v2] wrote templates to', outDir)
  console.log('[fill-addresses-v2] address stats', { filled, filledByAlias, already, missing, total: courses.length })

  // prepare env for child process (load .env.local)
  const childEnv = { ...process.env }
  const dotenvPath = path.resolve(workspaceRoot, '.env.local')
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
  // carry ignore fields setting if user wants; default none

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

  console.log('[fill-addresses-v2] realistic-dry-run finished')
}

main().catch((e) => {
  console.error('[fill-addresses-v2] error', e)
  process.exit(1)
})
