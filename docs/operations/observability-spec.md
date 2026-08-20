# Privacy-safe observability specification

This is the minimum provider-neutral contract for production dashboards and
alerts. Instrumentation must use an allowlist. Free-form request bodies, app
state, food text, photos, body measurements, chat messages, credentials, bearer
tokens, provider prompts/responses, and raw user identifiers are prohibited.

## Common fields

- `event_name`, `occurred_at`, `environment`, `release`, `platform`
- `request_id` or client-generated event ID
- allowlisted route or operation name
- duration bucket and result class
- pseudonymous installation/session cohort only after privacy approval

## Required service metrics

| Signal | Dimensions | Initial alert |
|---|---|---|
| API requests and errors | route, method, status class, release | 5xx >2% for 5 minutes |
| API latency | route, p50/p95/p99 | p95 >1.5 s for 10 minutes |
| Auth failures | operation, result class | 3× seven-day baseline or rate-limit saturation |
| State conflicts | release, platform | >1% of state writes for 10 minutes |
| Idempotent replays | release, platform | monitor; alert on sudden 5× baseline |
| Sync backlog | age/depth buckets, platform | p95 oldest mutation >15 minutes while online |
| Migration failures | migration ID, environment | any failure |
| Destructive deletion | result class | any unconfirmed/ambiguous spike |
| AI requests | provider, operation, result class, latency bucket | provider error >10% for 10 minutes |
| Crash-free sessions | release, platform | below 99.8% |

Thresholds are starting points. Baseline with internal traffic, then record the
approved values and dashboard links in release evidence.

## Redaction verification

Before connecting a sink, automated fixtures must attempt to inject date of
birth, height, weight, food text, photo bytes/URLs, chat content, JWTs, passwords,
database URLs, and provider keys. The serialized event must contain none of them.
Server error responses and logs expose stable error codes and request IDs, not
exception objects or database/provider messages.

## Retention and access

- Assign an explicit retention period to operational events, product analytics,
  crash reports, database backups, and deletion audit records.
- Restrict production log access by role and review it at least quarterly.
- Never use production user data in dashboards, screenshots, or support tickets.
- Record sink region, subprocessors, retention, deletion behavior, and alert
  owner in the privacy review before enabling collection.
