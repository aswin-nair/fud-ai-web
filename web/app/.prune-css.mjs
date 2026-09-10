import postcss from 'postcss'
import fs from 'node:fs'
import path from 'node:path'

const dead = new Set(JSON.parse(fs.readFileSync('.dead-classes.json', 'utf8')))
const files = []
;(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.css')) files.push(p)
  }
})('src/styles')

const apply = process.argv.includes('--apply')
let removedRules = 0, removedSelectors = 0, before = 0, after = 0

/* A selector can never match if any class it requires is dead — including as
   an ancestor, since that ancestor is never rendered either. */
function selectorIsDead(sel) {
  const classes = [...sel.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1])
  return classes.length > 0 && classes.some(c => dead.has(c))
}

for (const file of files) {
  const css = fs.readFileSync(file, 'utf8')
  before += css.length
  const root = postcss.parse(css, { from: file })

  root.walkRules(rule => {
    // Keyframe steps (`from`, `50%`) are not selectors in this sense.
    if (rule.parent && rule.parent.type === 'atrule' && /keyframes/.test(rule.parent.name)) return

    const kept = rule.selectors.filter(s => !selectorIsDead(s))
    if (kept.length === 0) {
      removedRules++
      rule.remove()
    } else if (kept.length !== rule.selectors.length) {
      removedSelectors += rule.selectors.length - kept.length
      rule.selectors = kept
    }
  })

  // An @media or @supports left with nothing in it goes too.
  let emptied = true
  while (emptied) {
    emptied = false
    root.walkAtRules(at => {
      if (/keyframes|import|charset|font-face|property/.test(at.name)) return
      if (at.nodes && at.nodes.length === 0) { at.remove(); emptied = true }
    })
  }

  const out = root.toString()
  after += out.length
  if (apply && out !== css) fs.writeFileSync(file, out)
}

console.log(`rules removed        : ${removedRules}`)
console.log(`selectors trimmed    : ${removedSelectors}`)
console.log(`CSS bytes            : ${before} -> ${after}  (-${(before - after)} , -${((1 - after / before) * 100).toFixed(1)}%)`)
console.log(apply ? 'WROTE changes' : 'dry run — pass --apply to write')
