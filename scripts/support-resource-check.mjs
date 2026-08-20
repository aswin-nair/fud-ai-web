import { readFileSync } from 'node:fs'

const reviewUrl = new URL('../docs/safety/support-resource-review.md', import.meta.url)
const review = readFileSync(reviewUrl, 'utf8')
const verified = review.match(/^Last verified:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
const nextReview = review.match(/^Next required review:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]

if (!verified || !nextReview) {
  console.error('Support-resource review must include ISO Last verified and Next required review dates.')
  process.exit(1)
}

const today = new Date()
const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
const verifiedUtc = Date.parse(`${verified}T00:00:00Z`)
const nextReviewUtc = Date.parse(`${nextReview}T23:59:59Z`)
const ageDays = Math.floor((todayUtc - verifiedUtc) / 86_400_000)

if (!Number.isFinite(verifiedUtc) || !Number.isFinite(nextReviewUtc) || ageDays < 0) {
  console.error('Support-resource review dates are invalid.')
  process.exit(1)
}
if (ageDays > 92 || todayUtc > nextReviewUtc) {
  console.error(`Support resources are stale: verified ${verified}, next review ${nextReview}.`)
  process.exit(1)
}

console.log(`Support-resource review is current (${ageDays} days old; renew by ${nextReview}).`)
