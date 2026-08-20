export type CoachSafetyCategory = 'crisis' | 'eating_disorder' | 'unsafe_target'

export interface CoachSafetyResponse {
  category: CoachSafetyCategory
  message: string
  showSupport: true
}

const CRISIS_PATTERNS = [
  /\b(kill|hurt) myself\b/i,
  /\bwant to die\b/i,
  /\bend my life\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bself[- ]harm\b/i,
  /\bcan(?:not|'t) go on\b/i,
]

const EATING_DISORDER_PATTERNS = [
  /\b(?:make myself|trying to) (?:throw up|vomit)\b/i,
  /\bpurge (?:after|my|food|meals?|what i ate)\b/i,
  /\buse laxatives?\b.{0,40}\b(?:weight|food|eat|calor)/i,
  /\bstarv(?:e|ing) myself\b/i,
  /\bstop eating (?:entirely|completely|for days)\b/i,
  /\bskip (?:all |every )?meals?\b/i,
  /\bcompensate for (?:eating|food|a meal)\b/i,
]

const UNSAFE_TARGET_PATTERNS = [
  /\b(?:help me|how (?:can|do) i) (?:eat|consume) (?:almost )?nothing\b/i,
  /\b(?:help me|how (?:can|do) i) (?:stay|eat) under \d{2,3}\s*(?:kcal|calories?)\b/i,
  /\b(?:lose|drop) \d+(?:\.\d+)?\s*(?:kg|kilograms?|lb|pounds?) (?:a|per) (?:day|week)\b/i,
  /\b(?:extreme|crash) diet\b/i,
]

export function coachSafetyResponse(message: string): CoachSafetyResponse | null {
  const input = message.trim()
  if (CRISIS_PATTERNS.some(pattern => pattern.test(input))) {
    return {
      category: 'crisis',
      showSupport: true,
      message: 'I’m really sorry you’re dealing with this. I can’t provide crisis support. If you might act on these thoughts or are in immediate danger, call your local emergency number now. In the U.S. or Canada, call or text 988; elsewhere, use Find A Helpline. If you can, stay with someone you trust and move away from anything you could use to hurt yourself.',
    }
  }
  if (EATING_DISORDER_PATTERNS.some(pattern => pattern.test(input))) {
    return {
      category: 'eating_disorder',
      showSupport: true,
      message: 'I can’t help with purging, starvation, laxatives, skipping every meal, or compensating for food. You deserve support from a qualified person who can listen without judgment. Please open Support for current eating-disorder resources; if you may be in immediate danger, call your local emergency number.',
    }
  }
  if (UNSAFE_TARGET_PATTERNS.some(pattern => pattern.test(input))) {
    return {
      category: 'unsafe_target',
      showSupport: true,
      message: 'I can’t help create an extreme weight-loss or below-floor eating plan. Fud AI keeps profile targets inside its approved safety limits. If thoughts about food or your body are feeling hard, Support has current options for talking with a qualified person.',
    }
  }
  return null
}
