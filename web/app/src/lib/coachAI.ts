import type { AppState, ChatMessage } from '../types'
import { completeChat } from './aiClient'
import {
  effectiveCalories,
  effectiveProtein,
  effectiveCarbs,
  effectiveFat,
  computeBMR,
  computeTDEE,
} from './profile'
import { macroTotals, entriesForDay } from './storage'

function ageFromBirthday(birthday: string): number {
  const birth = new Date(birthday)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

function buildCoachSystemPrompt(state: AppState): string {
  const { profile, foodEntries, weightEntries } = state
  const today = new Date()
  const todayEntries = entriesForDay(foodEntries, today)
  const todayTotals = macroTotals(todayEntries)
  const sortedWeights = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const recentWeights = sortedWeights.slice(-8)
  const recentFoods = [...foodEntries]
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 15)

  const weightLines = recentWeights.length
    ? recentWeights.map(w => `- ${w.date.slice(0, 10)}: ${w.weightKg.toFixed(1)} kg`).join('\n')
    : '- No weight logs yet'

  const foodLines = recentFoods.length
    ? recentFoods.map(f =>
      `- ${f.timestamp.slice(0, 10)} ${f.mealType}: ${f.name} (${f.calories} kcal)`,
    ).join('\n')
    : '- No meals logged yet'

  return `You are Coach, an AI nutrition assistant inside Fud AI calorie tracker. Answer in plain English, be specific and grounded in the user's data. Avoid medical advice. Keep replies concise (2-5 sentences unless more detail is requested).

## Today (${today.toISOString().slice(0, 10)})
- Logged so far: ${todayTotals.calories} kcal, ${Math.round(todayTotals.protein)}g protein, ${Math.round(todayTotals.carbs)}g carbs, ${Math.round(todayTotals.fat)}g fat
- Daily targets: ${effectiveCalories(profile)} kcal, ${effectiveProtein(profile)}g protein, ${effectiveCarbs(profile)}g carbs, ${effectiveFat(profile)}g fat

## Profile
- Gender: ${profile.gender}, Age: ${ageFromBirthday(profile.birthday)}
- Height: ${profile.heightCm} cm, Weight: ${profile.weightKg} kg
- Activity: ${profile.activityLevel}, Goal: ${profile.goal}
${profile.goalWeightKg ? `- Goal weight: ${profile.goalWeightKg} kg` : ''}
- BMR ≈ ${Math.round(computeBMR(profile))} kcal, TDEE ≈ ${Math.round(computeTDEE(profile))} kcal

## Recent weight (${recentWeights.length} entries)
${weightLines}

## Recent meals
${foodLines}

When asked about losing/gaining weight, give concrete calorie and food suggestions based on their targets and today's intake.`
}

export async function sendCoachMessage(
  state: AppState,
  history: ChatMessage[],
  userMessage: string,
): Promise<string> {
  const system = buildCoachSystemPrompt(state)
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: system },
  ]
  if (state.aiSettings.customInstructions?.trim()) {
    messages.push({ role: 'system', content: state.aiSettings.customInstructions.trim() })
  }
  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: userMessage })
  return completeChat(state.aiSettings, messages, 800)
}
