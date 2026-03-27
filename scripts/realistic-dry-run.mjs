import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(filePath) {
  const out = {}
  if (!fs.existsSync(filePath)) return out
  const raw = fs.readFileSync(filePath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue
    const idx = line.indexOf('=')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + 1).trim()
    out[key] = value
  }
  return out
}

const envFile = path.resolve('.env.local')
const fileEnv = loadEnvFile(envFile)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || fileEnv.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env')
  process.exit(1)
}
const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })

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

function norm(s) {
  return String(s || '')
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .replace(/[\",.'`·•]/g, '')
    .toLowerCase()
    .trim()
}

async function main() {
  console.log('ENV_CHECK', JSON.stringify({
    url: supabaseUrl,
    keyPrefix: serviceRoleKey.slice(0, 25),
    keyLength: serviceRoleKey.length,
  }))
  const inputPath = 'C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv'
  const reportPath = 'C:/Users/javas/.openclaw/workspace-javes/reports/realistic_dry_run_against_staging.json'
  const input = parseCsv(inputPath)
  const { data: existing, error } = await supabase.from('golf_courses').select('slug,name,address,region_primary')
  if (error) throw error

  const existingByKey = new Map(existing.map((r) => [`${norm(r.name)}||${norm(r.address)}`, r]))
  let inserts = 0
  let updates = 0
  const samples = []

  for (const r of input) {
    const key = `${r.name_norm}||${r.addr_norm}`
    const hit = existingByKey.get(key)
    if (hit) {
      updates++
      if (samples.length < 20) samples.push({ decision: 'UPDATE', input: r.name, existing_slug: hit.slug, key })
    } else {
      inserts++
      if (samples.length < 20) samples.push({ decision: 'INSERT', input: r.name, key })
    }
  }

  const report = {
    existing_courses: existing.length,
    input_rows: input.length,
    expected_inserts: inserts,
    expected_updates: updates,
    samples,
  }
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
}

main().catch((e) => {
  console.error('DRY_RUN_FATAL', JSON.stringify({ message: e?.message, details: e?.details, hint: e?.hint, code: e?.code }, null, 2))
  process.exit(1)
})
