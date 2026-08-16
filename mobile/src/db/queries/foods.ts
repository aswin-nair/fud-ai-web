import { desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { foods, type Food, type NewFood } from '@/db/schema';

const RECENTS_LIMIT = 12;
const SEARCH_LIMIT = 40;

/**
 * Recents and favourites are the whole reason repeat logging is fast — most
 * people eat the same twenty things — so this is what an empty search shows.
 */
export async function getRecentsAndFavorites(limit = RECENTS_LIMIT): Promise<Food[]> {
  return db
    .select()
    .from(foods)
    .where(or(eq(foods.isFavorite, true), sql`${foods.lastUsedAt} is not null`))
    .orderBy(desc(foods.isFavorite), desc(foods.lastUsedAt))
    .limit(limit);
}

/**
 * What an empty search box lists. On a fresh install nothing has been eaten
 * yet, so falling back to the whole catalogue keeps the screen browsable
 * instead of blank.
 */
export async function browseFoods(limit = SEARCH_LIMIT): Promise<Food[]> {
  return db
    .select()
    .from(foods)
    .orderBy(desc(foods.isFavorite), desc(foods.lastUsedAt), foods.name)
    .limit(limit);
}

export async function searchFoods(query: string, limit = SEARCH_LIMIT): Promise<Food[]> {
  const trimmed = query.trim();
  if (!trimmed) return browseFoods(limit);

  const pattern = `%${trimmed}%`;

  return db
    .select()
    .from(foods)
    .where(or(like(foods.name, pattern), like(foods.brand, pattern)))
    .orderBy(desc(foods.isFavorite), desc(foods.lastUsedAt), foods.name)
    .limit(limit);
}

export async function getFood(id: number): Promise<Food | null> {
  const rows = await db.select().from(foods).where(eq(foods.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createFood(values: NewFood): Promise<Food> {
  const [row] = await db.insert(foods).values(values).returning();
  return row as Food;
}

export async function setFavorite(id: number, isFavorite: boolean): Promise<void> {
  await db.update(foods).set({ isFavorite }).where(eq(foods.id, id));
}

export async function countFoods(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(foods);
  return row?.n ?? 0;
}
