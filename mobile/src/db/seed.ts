import { db } from '@/db/client';
import { foods, type NewFood } from '@/db/schema';
import { countFoods } from '@/db/queries/foods';

type SeedFood = Omit<NewFood, 'source' | 'isFavorite' | 'lastUsedAt'>;

/**
 * A small starter list so search is never empty on a fresh install. Values are
 * per the stated serving and rounded to whole grams; this is a habit tracker,
 * not a laboratory, and false precision would imply an accuracy no food
 * database has.
 */
const BUILTIN: SeedFood[] = [
  { name: 'Egg, large', brand: null, servingLabel: '1 egg', servingGrams: 50, kcal: 72, proteinG: 6, carbsG: 0, fatG: 5 },
  { name: 'Egg white', brand: null, servingLabel: '1 white', servingGrams: 33, kcal: 17, proteinG: 4, carbsG: 0, fatG: 0 },
  { name: 'Oats, rolled, dry', brand: null, servingLabel: '40 g', servingGrams: 40, kcal: 150, proteinG: 5, carbsG: 27, fatG: 3 },
  { name: 'Milk, whole', brand: null, servingLabel: '250 ml', servingGrams: 250, kcal: 155, proteinG: 8, carbsG: 12, fatG: 8 },
  { name: 'Milk, skimmed', brand: null, servingLabel: '250 ml', servingGrams: 250, kcal: 88, proteinG: 9, carbsG: 13, fatG: 0 },
  { name: 'Greek yoghurt, plain', brand: null, servingLabel: '170 g pot', servingGrams: 170, kcal: 100, proteinG: 17, carbsG: 6, fatG: 1 },
  { name: 'Banana', brand: null, servingLabel: '1 medium', servingGrams: 118, kcal: 105, proteinG: 1, carbsG: 27, fatG: 0 },
  { name: 'Apple', brand: null, servingLabel: '1 medium', servingGrams: 182, kcal: 95, proteinG: 0, carbsG: 25, fatG: 0 },
  { name: 'Orange', brand: null, servingLabel: '1 medium', servingGrams: 131, kcal: 62, proteinG: 1, carbsG: 15, fatG: 0 },
  { name: 'Blueberries', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 57, proteinG: 1, carbsG: 14, fatG: 0 },
  { name: 'Strawberries', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 32, proteinG: 1, carbsG: 8, fatG: 0 },
  { name: 'Avocado', brand: null, servingLabel: '1/2 fruit', servingGrams: 100, kcal: 160, proteinG: 2, carbsG: 9, fatG: 15 },
  { name: 'Bread, wholemeal', brand: null, servingLabel: '1 slice', servingGrams: 40, kcal: 92, proteinG: 4, carbsG: 15, fatG: 1 },
  { name: 'Bread, white', brand: null, servingLabel: '1 slice', servingGrams: 36, kcal: 96, proteinG: 3, carbsG: 18, fatG: 1 },
  { name: 'Bagel, plain', brand: null, servingLabel: '1 bagel', servingGrams: 105, kcal: 289, proteinG: 11, carbsG: 56, fatG: 2 },
  { name: 'Rice, white, cooked', brand: null, servingLabel: '1 cup', servingGrams: 158, kcal: 205, proteinG: 4, carbsG: 45, fatG: 0 },
  { name: 'Rice, brown, cooked', brand: null, servingLabel: '1 cup', servingGrams: 195, kcal: 218, proteinG: 5, carbsG: 46, fatG: 2 },
  { name: 'Pasta, cooked', brand: null, servingLabel: '1 cup', servingGrams: 140, kcal: 220, proteinG: 8, carbsG: 43, fatG: 1 },
  { name: 'Potato, baked', brand: null, servingLabel: '1 medium', servingGrams: 173, kcal: 161, proteinG: 4, carbsG: 37, fatG: 0 },
  { name: 'Sweet potato, baked', brand: null, servingLabel: '1 medium', servingGrams: 150, kcal: 135, proteinG: 3, carbsG: 31, fatG: 0 },
  { name: 'Chicken breast, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 165, proteinG: 31, carbsG: 0, fatG: 4 },
  { name: 'Chicken thigh, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 209, proteinG: 26, carbsG: 0, fatG: 11 },
  { name: 'Beef mince, 5% fat, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 170, proteinG: 26, carbsG: 0, fatG: 7 },
  { name: 'Steak, sirloin, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 244, proteinG: 27, carbsG: 0, fatG: 15 },
  { name: 'Pork chop, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 231, proteinG: 26, carbsG: 0, fatG: 14 },
  { name: 'Salmon, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 208, proteinG: 20, carbsG: 0, fatG: 13 },
  { name: 'Tuna, canned in water', brand: null, servingLabel: '1 can, drained', servingGrams: 142, kcal: 179, proteinG: 39, carbsG: 0, fatG: 1 },
  { name: 'Prawns, cooked', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 99, proteinG: 24, carbsG: 0, fatG: 0 },
  { name: 'Tofu, firm', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 144, proteinG: 17, carbsG: 3, fatG: 9 },
  { name: 'Lentils, cooked', brand: null, servingLabel: '1 cup', servingGrams: 198, kcal: 230, proteinG: 18, carbsG: 40, fatG: 1 },
  { name: 'Chickpeas, cooked', brand: null, servingLabel: '1 cup', servingGrams: 164, kcal: 269, proteinG: 15, carbsG: 45, fatG: 4 },
  { name: 'Black beans, cooked', brand: null, servingLabel: '1 cup', servingGrams: 172, kcal: 227, proteinG: 15, carbsG: 41, fatG: 1 },
  { name: 'Broccoli, cooked', brand: null, servingLabel: '1 cup', servingGrams: 156, kcal: 55, proteinG: 4, carbsG: 11, fatG: 1 },
  { name: 'Spinach, raw', brand: null, servingLabel: '100 g', servingGrams: 100, kcal: 23, proteinG: 3, carbsG: 4, fatG: 0 },
  { name: 'Carrot', brand: null, servingLabel: '1 medium', servingGrams: 61, kcal: 25, proteinG: 1, carbsG: 6, fatG: 0 },
  { name: 'Tomato', brand: null, servingLabel: '1 medium', servingGrams: 123, kcal: 22, proteinG: 1, carbsG: 5, fatG: 0 },
  { name: 'Mixed salad leaves', brand: null, servingLabel: '80 g', servingGrams: 80, kcal: 14, proteinG: 1, carbsG: 2, fatG: 0 },
  { name: 'Cheddar cheese', brand: null, servingLabel: '30 g', servingGrams: 30, kcal: 120, proteinG: 7, carbsG: 0, fatG: 10 },
  { name: 'Mozzarella', brand: null, servingLabel: '30 g', servingGrams: 30, kcal: 85, proteinG: 6, carbsG: 1, fatG: 6 },
  { name: 'Butter', brand: null, servingLabel: '1 tsp', servingGrams: 5, kcal: 36, proteinG: 0, carbsG: 0, fatG: 4 },
  { name: 'Olive oil', brand: null, servingLabel: '1 tbsp', servingGrams: 14, kcal: 119, proteinG: 0, carbsG: 0, fatG: 14 },
  { name: 'Peanut butter', brand: null, servingLabel: '1 tbsp', servingGrams: 16, kcal: 94, proteinG: 4, carbsG: 3, fatG: 8 },
  { name: 'Almonds', brand: null, servingLabel: '30 g', servingGrams: 30, kcal: 173, proteinG: 6, carbsG: 6, fatG: 15 },
  { name: 'Walnuts', brand: null, servingLabel: '30 g', servingGrams: 30, kcal: 196, proteinG: 5, carbsG: 4, fatG: 20 },
  { name: 'Hummus', brand: null, servingLabel: '2 tbsp', servingGrams: 30, kcal: 70, proteinG: 2, carbsG: 4, fatG: 5 },
  { name: 'Protein powder, whey', brand: null, servingLabel: '1 scoop', servingGrams: 30, kcal: 120, proteinG: 24, carbsG: 3, fatG: 2 },
  { name: 'Protein bar', brand: null, servingLabel: '1 bar', servingGrams: 60, kcal: 220, proteinG: 20, carbsG: 22, fatG: 7 },
  { name: 'Porridge with milk', brand: null, servingLabel: '1 bowl', servingGrams: 300, kcal: 260, proteinG: 11, carbsG: 38, fatG: 7 },
  { name: 'Cereal, corn flakes', brand: null, servingLabel: '30 g', servingGrams: 30, kcal: 113, proteinG: 2, carbsG: 25, fatG: 0 },
  { name: 'Sandwich, chicken salad', brand: null, servingLabel: '1 sandwich', servingGrams: 220, kcal: 430, proteinG: 28, carbsG: 42, fatG: 16 },
  { name: 'Burrito, chicken', brand: null, servingLabel: '1 large', servingGrams: 400, kcal: 615, proteinG: 44, carbsG: 38, fatG: 28 },
  { name: 'Pizza, cheese', brand: null, servingLabel: '1 slice', servingGrams: 107, kcal: 285, proteinG: 12, carbsG: 36, fatG: 10 },
  { name: 'Burger, beef, quarter pounder', brand: null, servingLabel: '1 burger', servingGrams: 200, kcal: 520, proteinG: 30, carbsG: 41, fatG: 26 },
  { name: 'Chips, oven baked', brand: null, servingLabel: '150 g', servingGrams: 150, kcal: 240, proteinG: 4, carbsG: 39, fatG: 8 },
  { name: 'Sushi, salmon roll', brand: null, servingLabel: '6 pieces', servingGrams: 170, kcal: 300, proteinG: 13, carbsG: 44, fatG: 7 },
  { name: 'Curry, chicken tikka masala', brand: null, servingLabel: '1 portion', servingGrams: 350, kcal: 520, proteinG: 35, carbsG: 22, fatG: 32 },
  { name: 'Soup, vegetable', brand: null, servingLabel: '1 bowl', servingGrams: 300, kcal: 120, proteinG: 4, carbsG: 20, fatG: 3 },
  { name: 'Chocolate, milk', brand: null, servingLabel: '25 g', servingGrams: 25, kcal: 133, proteinG: 2, carbsG: 15, fatG: 8 },
  { name: 'Biscuit, digestive', brand: null, servingLabel: '1 biscuit', servingGrams: 15, kcal: 71, proteinG: 1, carbsG: 10, fatG: 3 },
  { name: 'Crisps, ready salted', brand: null, servingLabel: '25 g bag', servingGrams: 25, kcal: 130, proteinG: 1, carbsG: 13, fatG: 8 },
  { name: 'Ice cream, vanilla', brand: null, servingLabel: '1 scoop', servingGrams: 66, kcal: 137, proteinG: 2, carbsG: 16, fatG: 7 },
  { name: 'Coffee, black', brand: null, servingLabel: '1 cup', servingGrams: 240, kcal: 2, proteinG: 0, carbsG: 0, fatG: 0 },
  { name: 'Latte, whole milk', brand: null, servingLabel: 'medium', servingGrams: 350, kcal: 190, proteinG: 10, carbsG: 15, fatG: 10 },
  { name: 'Orange juice', brand: null, servingLabel: '250 ml', servingGrams: 250, kcal: 112, proteinG: 2, carbsG: 26, fatG: 0 },
  { name: 'Cola', brand: null, servingLabel: '330 ml can', servingGrams: 330, kcal: 139, proteinG: 0, carbsG: 35, fatG: 0 },
  { name: 'Beer, lager', brand: null, servingLabel: '1 pint', servingGrams: 568, kcal: 208, proteinG: 2, carbsG: 17, fatG: 0 },
  { name: 'Wine, red', brand: null, servingLabel: '175 ml glass', servingGrams: 175, kcal: 149, proteinG: 0, carbsG: 4, fatG: 0 },
];

/** Idempotent: seeds only when the table is empty, so upgrades do not duplicate. */
export async function seedBuiltinFoods(): Promise<number> {
  if ((await countFoods()) > 0) return 0;

  const rows: NewFood[] = BUILTIN.map((food) => ({
    ...food,
    source: 'builtin',
    isFavorite: false,
    lastUsedAt: null,
  }));

  await db.insert(foods).values(rows);
  return rows.length;
}

export const BUILTIN_FOOD_COUNT = BUILTIN.length;
