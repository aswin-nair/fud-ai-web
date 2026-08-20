import { extname } from 'node:path'

export const TEXT_EXTENSIONS = new Set([
  '', '.css', '.entitlements', '.env', '.gradle', '.h', '.html', '.java', '.js', '.json',
  '.kt', '.kts', '.m', '.md', '.mjs', '.mm', '.pbxproj', '.plist', '.podspec', '.properties',
  '.sql', '.storyboard', '.swift', '.toml', '.ts', '.tsx', '.txt', '.xcconfig', '.xcscheme',
  '.xcworkspacedata', '.xml', '.yaml', '.yml',
])

export const SKIP_FILES = new Set(['package-lock.json'])
export const ALLOW_MARKER = 'secret-scan: allow'

export const SECRET_RULES = [
  ['private key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['OpenAI-style API key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['assigned production secret', /\b(?:JWT_SECRET|DATABASE_URL|GOOGLE_CLIENT_SECRET|API_KEY)\s*[:=]\s*["']?(?!replace|example|dummy|test|your-)[A-Za-z0-9_./:+@=-]{24,}/gi],
]

export function isTextCandidate(file) {
  if (SKIP_FILES.has(file.split(/[\\/]/).at(-1))) return false
  return TEXT_EXTENSIONS.has(extname(file).toLowerCase())
}

export function scanText(file, text) {
  const findings = []
  const lines = text.split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (line.includes(ALLOW_MARKER)) continue
    for (const [rule, pattern] of SECRET_RULES) {
      pattern.lastIndex = 0
      if (pattern.test(line)) findings.push({ file, line: index + 1, rule })
    }
  }
  return findings
}
