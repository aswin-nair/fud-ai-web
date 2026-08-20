import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { ALLOW_MARKER, isTextCandidate, scanText } from './security-scan-lib.mjs'

function repositoryFiles() {
  const output = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return output.split('\0').filter(Boolean)
}

const findings = []
for (const file of repositoryFiles()) {
  if (!isTextCandidate(file)) continue

  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  findings.push(...scanText(file, text))
}

if (findings.length > 0) {
  console.error('Potential committed secrets found (values are intentionally redacted):')
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}]`)
  }
  console.error(`Use "${ALLOW_MARKER}" only for a reviewed false positive.`)
  process.exitCode = 1
} else {
  console.log('Secret scan passed.')
}
