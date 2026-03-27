import fs from 'node:fs'

const full = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_testset_full_safe.json', 'utf8'))
const rows = full.rows
const batchSize = 100

for (let i = 0; i < rows.length; i += batchSize) {
  const batchRows = rows.slice(i, i + batchSize)
  const batchNo = Math.floor(i / batchSize) + 1
  const summary = {
    total: batchRows.length,
    update_auto: batchRows.filter((x) => x.mode === 'update-auto').length,
    update_manual: batchRows.filter((x) => x.mode === 'update-manual').length,
    insert_new: batchRows.filter((x) => x.mode === 'insert-new').length,
  }
  fs.writeFileSync(`C:/Users/javas/.openclaw/workspace-javes/reports/staging_full_safe_batch_${batchNo}.json`, JSON.stringify({ summary, rows: batchRows }, null, 2))
}

console.log(JSON.stringify({ total: rows.length, batches: Math.ceil(rows.length / batchSize) }, null, 2))
