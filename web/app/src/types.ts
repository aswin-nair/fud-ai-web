export type Gender = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive' | 'extraActive'
export type WeightGoal = 'lose' | 'maintain' | 'gain'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'
export type FoodSource = 'textInput' | 'manual' | 'snapFood'

import type { AISettings } from './lib/aiConfig'

export type { AIProvider, AISettings } from './lib/aiConfig'

export interface UserProfile {
  name?: string
  gender: Gender
  birthday: string
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: WeightGoal
  bodyFatPercentage?: number
  weeklyChangeKg?: number
  goalWeightKg?: number
  customCalories?: number
  customProtein?: number
  customFat?: number
  customCarbs?: number
}

export interface FoodEntry {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  timestamp: string
  emoji?: string
  source: FoodSource
  mealType: MealType
  servingSizeGrams?: number
}

export interface SavedMeal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  emoji?: string
  mealType: MealType
  servingSizeGrams?: number
}

export interface WeightEntry {
  id: string
  date: string
  weightKg: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface FoodAnalysis {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  servingSizeGrams: number
  emoji?: string
}

export interface AppState {
  onboarded: boolean
  profile: UserProfile
  foodEntries: FoodEntry[]
  weightEntries: WeightEntry[]
  favoriteMeals: SavedMeal[]
  chatMessages: ChatMessage[]
  aiSettings: AISettings
}

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  other: 'Other',
}

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  light: 'Light',
  moderate: 'Moderate',
  active: 'Active',
  veryActive: 'Very Active',
  extraActive: 'Extra Active',
}

export const GOAL_LABELS: Record<WeightGoal, string> = {
  lose: 'Lose Weight',
  maintain: 'Maintain',
  gain: 'Gain Weight',
}
