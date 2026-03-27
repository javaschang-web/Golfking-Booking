import fs from 'node:fs'

const safeSlugMap = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/safe_slug_map.json', 'utf8'))
const oldSet = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100.json', 'utf8'))

const transformed = oldSet.rows.map((row) => ({
  ...row,
  safe_slug: row.mode === 'insert-new' ? safeSlugMap[row.input_name] : row.staging_slug,
}))

const summary = {
  total: transformed.length,
  update_auto: transformed.filter((x) => x.mode === 'update-auto').length,
  update_manual: transformed.filter((x) => x.mode === 'update-manual').length,
  insert_new: transformed.filter((x) => x.mode === 'insert-new').length,
}

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100_safe.json', JSON.stringify({ summary, rows: transformed }, null, 2))
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_100_safe.md', ['# staging testset 100 safe', '', `- total: ${summary.total}`, `- update_auto: ${summary.update_auto}`, `- update_manual: ${summary.update_manual}`, `- insert_new: ${summary.insert_new}`, ''].join('\n'))
console.log(JSON.stringify(summary, null, 2))
