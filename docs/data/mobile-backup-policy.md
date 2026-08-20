# Mobile nutrition database backup policy

- Status: Accepted
- Date: 2026-08-20
- Owners: Engineering

## Decision

The Expo SQLite nutrition database is excluded from device backups.

- Android Auto Backup is off (`mobile/app.config.ts` `android.allowBackup: false`).
- iOS iCloud backup of `Documents/SQLite/calorie-tracker.db` is not an approved restore path. The file is treated as excluded; recovery is a user-initiated JSON export.

There is no approved policy for restoring a nutrition database from iCloud or Google Drive.

## Why

The database can contain birth dates, body measurements, and food logs. A silent backup/restore can attach the wrong history to a later install or a different Apple/Google account.

## Restore

Users can export a secret-free JSON file from Settings and keep that copy themselves. App lock credentials are never included.
