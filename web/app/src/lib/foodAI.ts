import type { AISettings } from './aiConfig'
import type { FoodAnalysis } from '../types'
import { completeChat, completeVision } from './aiClient'

const FOOD_JSON_SHAPE = `{"name":"...","calories":0,"protein":0.0,"carbs":0.0,"fat":0.0,"serving_size_grams":0.0,"emoji":"🍽️","unit_options":[]}`
const NUTRIENT_UNITS =
  'Calories are integers. Protein/carbs/fat are decimal gram values. serving_size_grams is estimated weight in grams.'

function extractJSON(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found in AI response')
  return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>
}

function toAnalysis(data: Record<string, unknown>): FoodAnalysis {
  const name = String(data.name ?? 'Unknown food')
  const calories = Number(data.calories ?? 0)
  const protein = Number(data.protein ?? 0)
  const carbs = Number(data.carbs ?? 0)
  const fat = Number(data.fat ?? 0)
  const servingSizeGrams = Number(data.serving_size_grams ?? 100)
  const emoji = data.emoji != null ? String(data.emoji) : '🍽️'
  if (!name || Number.isNaN(calories)) throw new Error('Invalid food analysis response')
  return { name, calories, protein, carbs, fat, servingSizeGrams, emoji }
}

function textPrompt(description: string): string {
  return `Estimate the nutritional content for: ${description}
Parse quantities, brands, and multiple items. Sum totals if multiple items.
Respond ONLY with JSON:
${FOOD_JSON_SHAPE}
${NUTRIENT_UNITS}
Include a single food emoji. Use null for unknown nutrients.`
}

const imagePrompt = `Analyze this food image. Identify the food and estimate nutritional content for the serving shown.
Respond ONLY with JSON:
${FOOD_JSON_SHAPE}
${NUTRIENT_UNITS}
Include a single food emoji representing the food.`

export async function analyzeTextFood(description: string, settings: AISettings): Promise<FoodAnalysis> {
  const messages = [{ role: 'user' as const, content: textPrompt(description) }]
  const text = await completeChat(settings, messages)
  return toAnalysis(extractJSON(text))
}

export async function analyzeImageFood(
  imageBase64: string,
  settings: AISettings,
  mimeType = 'image/jpeg',
): Promise<FoodAnalysis> {
  const text = await completeVision(settings, imagePrompt, imageBase64, mimeType)
  return toAnalysis(extractJSON(text))
}

export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result)
      const match = result.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) reject(new Error('Could not read image'))
      else resolve({ mimeType: match[1], base64: match[2] })
    }
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}
