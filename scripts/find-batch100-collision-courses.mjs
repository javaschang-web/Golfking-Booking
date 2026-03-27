import fs from 'node:fs'

const results = JSON.parse(fs.readFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_batch100_rerun_apply_result.json', 'utf8')).results
const grouped = new Map()
for (const row of results) {
  const arr = grouped.get(row.slug) || []
  arr.push(row)
  grouped.set(row.slug, arr)
}
const collisions = Array.from(grouped.entries())
  .filter(([, rows]) => rows.length > 1)
  .map(([slug, rows]) => ({ slug, count: rows.length, rows }))

fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_batch100_slug_collisions.json', JSON.stringify(collisions, null, 2))
fs.writeFileSync('C:/Users/javas/.openclaw/workspace-javes/reports/staging_batch100_slug_collisions.md', ['# staging batch100 slug collisions', '', ...collisions.map(c => `- ${c.slug} (${c.count}) -> ${c.rows.map(r => r.name).join(', ')}`), ''].join('\n'))
console.log(JSON.stringify({ collision_groups: collisions.length }, null, 2))
