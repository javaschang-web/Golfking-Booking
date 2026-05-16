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

function stripBOM(s = '') {
  return String(s).replace(/^\uFEFF/, '')
}

function debugString(s = '') {
  return {
    text: s,
    len: String(s).length,
    codepoints: Array.from(String(s)).map((ch) => ch.codePointAt(0).toString(16)),
  }
}

function norm(s) {
  return String(s || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[\",.'`()\-_/]/g, '')
    .trim()
}

function stripCourseName(s) {
  return norm(s)
    .replace(/일반대중홀/g, '')
    .replace(/회원제/g, '')
    .replace(/대중제/g, '')
    .replace(/퍼블릭/g, '')
    .replace(/public/g, '')
    .replace(/컨트리구락부/g, '')
    .replace(/컨트리클럽/g, '')
    .replace(/골프클럽/g, '')
    .replace(/골프장/g, '')
    .replace(/골프앤리조트/g, '')
    .replace(/골프&리조트/g, '')
    .replace(/리조트/g, '')
    .replace(/countryclub/g, '')
    .replace(/country/g, '')
    .replace(/club/g, '')
    .replace(/golf/g, '')
    .replace(/cc/g, '')
    .replace(/gc/g, '')
    .trim()
}

function regionSecondaryVariants(addr = '') {
  const token = String(addr).trim().split(/\s+/)[0] || ''
  const n = norm(token)
  const stripped = n.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '')
  return Array.from(new Set([n, stripped].filter(Boolean)))
}

function existingSecondaryVariants(regionSecondary = '') {
  const n = norm(regionSecondary)
  const stripped = n.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/g, '')
  return Array.from(new Set([n, stripped].filter(Boolean)))
}

function cityMatches(inputAddr, existingSecondary) {
  if (!existingSecondary) return true
  const a = regionSecondaryVariants(inputAddr)
  const b = existingSecondaryVariants(existingSecondary)
  return a.some((x) => b.some((y) => x.includes(y) || y.includes(x)))
}

function scoreCandidate(existing, input) {
  const en = stripCourseName(existing.name)
  const inn = stripCourseName(input.name)
  const sameRegion = norm(existing.region_primary) === norm(input.region)
  const sameCity = cityMatches(input.addr, existing.region_secondary)
  if (!sameRegion) return 0
  if (en && inn && en === inn && sameCity) return 100
  if (en && inn && (en.includes(inn) || inn.includes(en)) && sameCity) return 70
  if (en && inn && en === inn) return 60
  if (en && inn && (en.includes(inn) || inn.includes(en))) return 40
  return 0
}

const input = parseCsv('C:/Users/javas/.openclaw/workspace-javes/data/bulk_import_ready.csv')
// Use normalized name as a lookup key to tolerate mojibake / whitespace / punctuation differences.
const inputByNameNorm = new Map(input.map((r) => [norm(stripBOM(r.name)), r]))
const staging = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_courses_export.json', 'utf8'))

// Debug helper: print candidates for specific staging slugs when needed.
const DEBUG_SLUGS = new Set([])

// Manual approvals are maintained in build-staging-testset-full-safe.mjs.
// Use staging_slug as the key (NOT staging_name) to avoid mojibake/encoding issues.
//
// Two forms are supported:
// - string: approved input name (exact-ish; resolved through normalized-name lookup)
// - object: { name_norm, addr_norm } for robust lookup even if raw names are mojibake
const manualApprovedBySlug = new Map([
  // G.C is just an abbreviation of 골프클럽; prefer public-course records when both exist.
  // bulk_import_ready.csv name: '㈜호텔롯데스카이힐제주CC'
  ['lotte-skyhill-jeju', '㈜호텔롯데스카이힐제주CC'],
  // staging slug represents Club72 Ocean course; input uses legacy SKY72 naming.
  ['sky72-ocean', 'SKY72 골프클럽(바다코스)'],
  ['jade-palace', '제이드팰리스 골프클럽'],
  ['belles-forest', '벨라스톤컨트리클럽'],
  ['oak-valley', '오크밸리 대중골프장'],
  // Added from fallback manual review
  ['ansung-benest', '안성베네스트G.C'],
  ['pinevalley', '파인밸리컨트리클럽'],

  // 2026-04-03 manual approvals
  // 부산 해운대: name 문자열이 출력/인코딩 환경에 따라 흔들릴 수 있어 addr_norm 기반으로 고정
  ['bs-course-a8438795', { name_norm: '해운대비치골프앤리조트', addr_norm: '부산 기장군 기장읍 대변로 74' }],
  ['bs-course-d73c59e3', { name_norm: '해운대컨트리클럽', addr_norm: '부산 기장군 정관면 병산2로 265' }],

  // 안성 신안
  ['gg-course-02e5323a', '신안 퍼블릭 CC'],
  ['gg-course-aa1f712f', '신안컨트리클럽'],

  // 경남 남해 아난티남해: GC/CC 표기만 다른 동점 케이스 → slug 이름에 맞춰 고정
  ['gn-course-7a5d409d', '아난티남해GC'],
  ['gn-course-b3a23c87', '아난티남해CC'],

  // 강원 원주 "센추리21" 계열 (더블루/CC/CCⅡ)
  // 입력 후보에 '센추리21더블루' 라벨은 없고, public 코스는 '센추리21퍼블릭'으로 잡혀있음
  ['gw-21-9606815a', '센추리21퍼블릭'],
  ['gw-21-daf11173', '센추리21컨트리클럽'],
  ['gw-21-ii-58fb5f24', '센추리21컨트리클럽Ⅱ'],

  // 강원 횡성 웰리힐리 계열 (퍼블릭/클럽)
  ['gw-course-9ebbd422', '웰리힐리퍼블릭골프장'],
  ['gw-course-d16f2530', '웰리힐리컨트리클럽'],

  // 경기 인천(일동/강화) 계열: 실제 staging_name에 맞춰 고정
  ['gg-course-126589dc', '일동레이크 골프클럽'],
  ['gg-course-66b37b7a', '일동레이크 골프클럽'],

  // --- Decisions (2026-04-03)
  // 안성베네스트: 대표는 안성베네스트G.C
  ['gg-course-7baa85f8', '안성베네스트G.C'],
  ['gg-g-c-c291230f', '안성베네스트G.C'],

  // (100,100) 동점: 주소가 더 긴(상세한) 쪽으로 통일
  // NOTE: approved objects must match bulk_import_ready.csv's exact raw name+addr (after our norm()).
  // Use the exact candidate addr strings from reports/fallback_match_report.json.
  ['cb-course-3124ecd8', { name_norm: '세레니티cc(구, 실크리버)', addr_norm: '청주시 서원구 남이면 문곡구절골길 235' }],
  ['cb-course-9a37332e', { name_norm: '천룡', addr_norm: '진천군 이월면 진안로 347-123' }],
  ['gg-c-c-fc767035', { name_norm: '포천아도니스 C.C', addr_norm: '포천시 신북면 포천로 2499/신북면 고일리(산) 59' }],
  ['gg-course-6c9b2318', { name_norm: '지산CC', addr_norm: '용인시 처인구 원삼면 죽양대로 2000번길 60' }],
  ['gg-course-c6703db8', { name_norm: '몽베르컨트리클럽', addr_norm: '포천시 영북면 산정호수로 359-12' }],

  // (60,40,40)
  ['gw-course-8e0c13e9', '용평리조트골프클럽'],

  // --- Decisions (2026-04-03): remaining (60,40) pairs/solos approved as top candidate
  ['gw-700-7527699e', '알펜시아 700골프클럽'],
  ['gw-course-c212c325', '알펜시아컨트리클럽'],
  ['gw-c-c-a3c6adee', '오투리조트 C.C'],
  ['gw-course-4ca7b4de', '오투리조트 골프'],
  ['gw-course-15f415f0', '설해원'],
  ['gw-course-f1247706', '설해원 더 레전드 코스'],
  ['gw-course-4c240930', '엘리시안 강촌컨트리클럽'],
  ['gw-course-734ce05b', '엘리시안 강촌대중골프장'],
  ['gw-course-5fc22ddb', '휘닉스대중골프장'],
  ['gw-course-ba05b062', '휘닉스 컨트리클럽'],
  ['jj-course-78a4ff34', '나인브릿지 퍼블릭'],
  ['jj-course-e4ff45d1', '클럽나인브릿지'],
  ['gw-course-3eec0c7d', '오크밸리 대중골프장'],
  ['gw-course-549a493a', '용평버치힐골프클럽'],
  ['gw-course-c069f64a', '용평리조트대중골프장'],
  ['jj-course-5964f97c', '㈜우리들리조트 제주'],

  // --- AUTO(APPROVED): single-candidate score=60 (generated from reports/fallback_match_report.json)
  ['bs-course-21292077', '아시아드컨드리클럽'],
  ['bs-course-2fde7740', '해라컨트리클럽'],
  ['bs-course-3c2dd7f9', '베이사이트골프클럽'],
  ['bs-course-574680ff', '기장동원로얄컨트리클럽'],
  ['bs-course-57c3d73d', '부산컨트리클럽'],
  ['bs-course-89c95c8c', '스톤게이트컨트리클럽'],
  ['bs-course-c9b4dcd8', '하이스트컨트리클럽'],
  ['bs-course-f362f960', '동래베네스트골프클럽'],
  ['dg-course-c9d51274', '팔공컨트리클럽'],
  ['dg-course-d570a5d6', '냉천컨트리클럽'],
  ['dj-course-c026817e', '대덕복지센터'],
  ['dj-course-d10f01aa', '금실대덕밸리CC'],
  ['dj-course-dedff0ef', '유성컨트리클럽'],
  ['gj-course-11a2741c', '빛고을컨트리클럽'],
  ['gj-course-32c74e43', '에콜리안광산골프장'],
  ['gj-course-878dc837', '어등산컨트리클럽'],
  ['gw-and-3bb6b29a', '샤인데일골프&리조트'],
  ['gw-and-c2f470eb', '클럽모우골프 &라이프스타일'],
  ['gw-and-d7fdf935', '메이플비치골프&리조트'],
  ['gw-course-005c60c6', '영랑호컨트리클럽'],
  ['gw-course-0575927b', '동강시스타대중골프장'],
  ['gw-course-1de52941', '동서울레스피아'],
  ['gw-course-1f8bfd87', '파가니카컨트리클럽'],
  ['gw-course-1ff7dd03', '에콜리안정선골프장'],
  ['gw-course-257b401e', '소노펠리체 컨트리클럽 비발디파크 이스트'],
  ['gw-course-2965e0de', '하이원컨트리클럽'],
  ['gw-course-29cb8e09', '한탄강컨트리클럽'],
  ['gw-course-2fafafde', '비콘힐스골프클럽'],
  ['gw-course-5bf10d8c', '에스엘세레스 옥스필드 CC'],
  ['gw-course-5e8eeece', '인터불고원주골프클럽'],
  ['gw-course-779ff1c6', '라비에벨컨트리클럽'],
  ['gw-course-8545fd51', '블랙밸리컨트리클럽'],
  ['gw-course-8bdc4e97', '더플레이어스 골프클럽'],
  ['gw-course-98372db4', '설악썬밸리컨트리클럽'],
  ['gw-course-98fd502e', '스프링베일리조트'],
  ['gw-course-9ceea4b4', '세이지우드CC홍천'],
  ['gw-course-a95c5afd', '파인리즈컨트리클럽'],
  ['gw-course-a9b8a351', '소노펠리체 컨트리클럽 비발디파크 마운틴'],
  ['gw-course-ab3d6175', '휘슬링락컨트리클럽'],
  ['gw-course-c92fa6aa', '샌드파인골프클럽'],
  ['gw-course-cc9c46d3', '소노펠리체 컨트리클럽 델피노'],
  ['gw-course-cd1d7a17', '파크밸리골프클럽'],
  ['gw-course-cdb3adbc', '로드힐스골프클럽'],
  ['gw-course-dd0344dc', '베어크리크 춘천'],
  ['gw-course-dee572a5', '알프스대영컨트리클럽'],
  ['gw-course-df319c4c', '남춘천컨트리클럽'],
  ['gw-course-e5d00329', '설악프라자컨트리클럽'],
  ['gw-course-e70d7204', '힐드로사이컨트리클럽'],
  ['gw-course-e8bc54a7', '파인밸리컨트리클럽'],
  ['gw-course-ed7989cc', '라데나골프클럽'],
  ['gw-course-f350042a', '오너스골프클럽'],
  ['gw-course-f61e5a1c', '소노펠리체 컨트리클럽 비발디파크 웨스트'],
  ['gw-course-fe9c891d', '동원썬밸리컨트리클럽'],
  ['gw-oak-hills-b0d3a918', 'Oak Hills컨트리클럽'],
  ['jb-and-46c270e7', '내장산골프&리조트'],
  ['jb-clubd-9a21ebf2', 'CLUBD 금강'],
  ['jb-course-0430266b', '골프존카운티무주'],
  ['jb-course-0be0e149', '고창CC'],
  ['jb-course-0d8b0623', '장수골프리조트'],
  ['jb-course-20ef661a', '전주샹그릴라CC'],
  ['jb-course-2c2622d8', '아네스빌CC'],
  ['jb-course-30bf2f77', '웅포컨트리클럽'],
  ['jb-course-46306884', '태인CC'],
  ['jb-course-4ef7415e', '무주덕유산CC'],
  ['jb-course-537207f9', '남원상록골프장'],
  ['jb-course-5d6767dc', '군산CC'],
  ['jb-course-6aff61de', '더나인골프클럽'],
  ['jb-course-763d9a1a', '석정힐CC'],
  ['jb-course-7723e606', '골프존 카운티 드래곤'],
  ['jb-course-8024415b', '전주월드컵골프장'],
  ['jb-course-831b8ac6', '케이밸리컨트리클럽'],
  ['jb-course-88734f77', '김제스파힐스CC'],
  ['jb-course-9ecef69a', '에스페란사GC'],
  ['jb-course-a9da744b', '디케이레저'],
  ['jb-course-ae8048e1', '금과골프장'],
  ['jb-course-b8ecc17f', '상떼힐CC'],
  ['jb-course-d2195764', '써미트CC'],
  ['jb-course-e805758a', '익산컨트리클럽'],
  ['jb-course-f324085d', '골프존카운티선운'],
  ['jb-okcc-c3915bac', 'OKCC'],
  ['jj-course-3d9055cf', '테디밸리골프앤리조트'],
  ['jj-course-ecdcd433', '레이크힐스'],
])

const autoMatches = []
const manualReview = []
const noMatch = []

for (const existing of staging) {
  const candidates = input
    .map((row) => ({ row, score: scoreCandidate(existing, row) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name, 'ko'))

  const top = candidates[0]
  const topCount = candidates.filter((c) => c.score === (top?.score ?? -1)).length

  // If we have an explicit manual approval for this staging course, treat it as
  // an approved match (so it doesn't keep showing up as manual review forever).
  const approved = manualApprovedBySlug.get(existing.slug)
  if (approved) {
    if (DEBUG_SLUGS.has(existing.slug)) {
      console.log('[DEBUG] manualApprovedBySlug hit', { slug: existing.slug, approved })
    }

    let row
    if (typeof approved === 'string') {
      row = inputByNameNorm.get(norm(stripBOM(approved)))
    } else if (approved && typeof approved === 'object') {
      const wantName = norm(stripBOM(approved.name_norm || ''))
      const wantAddr = norm(stripBOM(approved.addr_norm || ''))
      row = input.find((r) => norm(stripBOM(r.name)) === wantName && norm(stripBOM(r.addr)) === wantAddr)
    }

    if (!row) {
      // eslint-disable-next-line no-console
      console.warn('[manualApprovedBySlug] missing input row', {
        staging_name: existing.name,
        staging_slug: existing.slug,
        approved,
        sample_input_key: debugString(stripBOM(input[0]?.name)),
      })
    }
    if (row) {
      autoMatches.push({
        staging_slug: existing.slug,
        staging_name: existing.name,
        input_name: row.name,
        input_addr: row.addr,
        score: 999,
      })
      continue
    }
  }

  if (DEBUG_SLUGS.has(existing.slug)) {
    console.log('[DEBUG] candidates', {
      slug: existing.slug,
      staging_name: existing.name,
      candidates: candidates.slice(0, 5).map((c) => ({ name: c.row.name, addr: c.row.addr, region: c.row.region, score: c.score })),
    })
  }

  if (top && top.score >= 100 && topCount === 1) {
    autoMatches.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      input_name: top.row.name,
      input_addr: top.row.addr,
      score: top.score,
    })
  } else if (candidates.length > 0) {
    manualReview.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      top_candidates: candidates.slice(0, 5).map((c) => ({
        input_name: c.row.name,
        input_addr: c.row.addr,
        region: c.row.region,
        score: c.score,
      })),
    })
  } else {
    noMatch.push({
      staging_slug: existing.slug,
      staging_name: existing.name,
      region_primary: existing.region_primary,
      region_secondary: existing.region_secondary,
    })
  }
}

const report = {
  staging_total: staging.length,
  input_total: input.length,
  auto_match_count: autoMatches.length,
  manual_review_count: manualReview.length,
  no_match_count: noMatch.length,
  auto_matches: autoMatches,
  manual_review: manualReview,
  no_match: noMatch,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.json', JSON.stringify(report, null, 2))

const md = [
  '# fallback match report',
  '',
  `- staging_total: ${report.staging_total}`,
  `- input_total: ${report.input_total}`,
  `- auto_match_count: ${report.auto_match_count}`,
  `- manual_review_count: ${report.manual_review_count}`,
  `- no_match_count: ${report.no_match_count}`,
  '',
  '## auto matches',
  ...autoMatches.map((m) => `- ${m.staging_name} (${m.staging_slug}) -> ${m.input_name} / ${m.input_addr}`),
  '',
  '## manual review',
  ...manualReview.map((m) => `- ${m.staging_name} (${m.staging_slug}) -> ${m.top_candidates.map((c) => `${c.input_name} [${c.score}]`).join(', ')}`),
  '',
  '## no match',
  ...noMatch.map((m) => `- ${m.staging_name} (${m.staging_slug}) / ${m.region_primary} ${m.region_secondary ?? ''}`),
  '',
]
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/fallback_match_report.md', md.join('\n'))
console.log(JSON.stringify({
  auto_match_count: report.auto_match_count,
  manual_review_count: report.manual_review_count,
  no_match_count: report.no_match_count,
}, null, 2))
