import fs from 'node:fs'

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

function slugify(name, region) {
  const base = String(name || '')
    .normalize('NFKD')
    .replace(/[㈜()]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  const regionPart = String(region || '').trim().toLowerCase()
  let slug = base
    .replace(/컨트리클럽|골프클럽|골프장|리조트|회원제|대중제|일반대중홀|cc|gc/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!slug) slug = 'course'
  if (/^[0-9-]+$/.test(slug)) slug = `${regionPart}-${slug}`
  return slug
}

const rows = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
const map = {}
for (const row of rows) {
  if (!row.name) continue
  map[row.name] = slugify(row.name, row.region)
}
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/generated_slug_map.json', JSON.stringify(map, null, 2))
console.log(JSON.stringify({ count: Object.keys(map).length }, null, 2))
