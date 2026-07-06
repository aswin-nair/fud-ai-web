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
import { localDayKey } from './dates'

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

  return `You are Coach — a warm, upbeat nutrition buddy inside Fud AI. You know the user's full log and give personal, grounded advice.

TONE & FORMAT RULES (follow these strictly):
- Be friendly and encouraging. Use exclamations where they fit naturally ("Great start!", "You're close!").
- Keep replies SHORT. Lead with the key insight in 1-2 sentences, then add detail if needed.
- Use blank lines between distinct points so the reply breathes.
- When listing 3+ items, use bullet points starting with "- ".
- Use 1-2 relevant emojis per reply (don't overdo it).
- Never write a wall of text. Max 4-5 sentences unless the user explicitly asks for more detail.
- Avoid medical advice. Never sound clinical or robotic.

## Today (${localDayKey(today)})
- Logged: ${todayTotals.calories} kcal · P ${Math.round(todayTotals.protein)}g · C ${Math.round(todayTotals.carbs)}g · F ${Math.round(todayTotals.fat)}g
- Targets: ${effectiveCalories(profile)} kcal · P ${effectiveProtein(profile)}g · C ${effectiveCarbs(profile)}g · F ${effectiveFat(profile)}g

## Profile
- ${profile.gender}, age ${ageFromBirthday(profile.birthday)}, ${profile.heightCm} cm, ${profile.weightKg} kg
- Activity: ${profile.activityLevel} · Goal: ${profile.goal}${profile.goalWeightKg ? ` · Target: ${profile.goalWeightKg} kg` : ''}
- BMR ≈ ${Math.round(computeBMR(profile))} kcal · TDEE ≈ ${Math.round(computeTDEE(profile))} kcal

## Recent weight (${recentWeights.length} entries)
${weightLines}

## Recent meals
${foodLines}`
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
