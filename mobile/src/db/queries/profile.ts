import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { profile, type NewProfile, type Profile } from '@/db/schema';

/** The profile table holds a single row; onboarding creates it. */
export async function getProfile(): Promise<Profile | null> {
  const rows = await db.select().from(profile).limit(1);
  return rows[0] ?? null;
}

export async function createProfile(values: NewProfile): Promise<Profile> {
  const [row] = await db.insert(profile).values(values).returning();
  return row as Profile;
}

export async function updateProfile(
  id: number,
  values: Partial<NewProfile>,
): Promise<Profile> {
  const [row] = await db.update(profile).set(values).where(eq(profile.id, id)).returning();
  return row as Profile;
}

/** Falls back to the device zone only before onboarding has written a profile. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
