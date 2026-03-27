import fs from 'node:fs'
import crypto from 'node:crypto'

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

function shortHash(input) {
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 8)
}

function regionCode(region = '') {
  const map = {
    '경기': 'gg', '강원': 'gw', '충북': 'cb', '충남': 'cn', '경북': 'gb', '경남': 'gn',
    '전북': 'jb', '전남': 'jn', '제주': 'jj', '서울': 'se', '부산': 'bs', '인천': 'ic',
    '대구': 'dg', '광주': 'gj', '대전': 'dj', '울산': 'us', '세종': 'sj',
  }
  return map[String(region).trim()] || 'kr'
}

function asciiBase(name = '') {
  const base = String(name)
    .normalize('NFKD')
    .replace(/[㈜()]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\b(cont(?:ry)?|club|golf|course|cc|gc|resort|public)\b/gi, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return base || 'course'
}

const rows = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
const map = {}
const counts = {}
for (const row of rows) {
  if (!row.name) continue
  const hash = shortHash(`${row.name}|${row.addr}|${row.region}`)
  const slug = `${regionCode(row.region)}-${asciiBase(row.name)}-${hash}`
  map[row.name] = slug
  counts[slug] = (counts[slug] || 0) + 1
}
const dupes = Object.entries(counts).filter(([, c]) => c > 1)
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/safe_slug_map.json', JSON.stringify(map, null, 2))
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/safe_slug_map_dupes.json', JSON.stringify(dupes, null, 2))
console.log(JSON.stringify({ count: Object.keys(map).length, duplicate_slug_count: dupes.length }, null, 2))
