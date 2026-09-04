import type { TauntPose } from './mascotVoice'

type RoastScreen = 'today' | 'log' | 'insights' | 'you'
export interface RoastAct { line: string; pose: TauntPose }
// Reviewed local copy only. Inputs never include a meal, body measurement,
// calorie target, identity, or free-form user text.
export const GENERAL_ROASTS = [
  'You clicked me like I owe you rent.',
  'Your thumb has main-character energy. The rest of us are supporting cast.',
  'You brought the scrolling. I brought the unsolicited commentary.',
  'I am a dumpling with a job. What is your excuse for poking coworkers?',
  'You have the confidence of someone who never reads the button label.',
  'Our relationship is mostly you tapping and me filing complaints.',
  'You came for an app. You got a tiny roommate with opinions.',
  'That was a very convincing impression of someone with a plan.',
  'You and the back button seem to be in a committed relationship.',
  'I have no pockets, yet somehow I am carrying this conversation.',
  'You really saw a talking dumpling and thought: finally, management.',
  'I would give you a standing ovation, but these legs are mostly decorative.',
]
export const SCREEN_ROASTS: Record<RoastScreen, readonly string[]> = {
  today: [
    'Welcome to Today. Yesterday called; it wants its open tabs back.',
    'You are browsing this dashboard like it has a secret bonus level.',
    'The calendar says Today. Groundbreaking. We should publish this.',
    'This is your dashboard, not a staring contest. Although I am winning.',
    'Another look at the homepage. The homepage is feeling very appreciated.',
    'The main character has entered. I will notify absolutely nobody.',
  ],
  log: [
    'You are studying these buttons like there is a final exam.',
    'This menu has options. Your decision-making has requested a meeting.',
    'The search bar is not a magic wand, but I respect the optimism.',
    'You and the portion picker are deep in negotiations.',
    'You found the shortcut. The scenic route sends its regards.',
    'The keyboard has entered the chat. Everyone act professional.',
  ],
  insights: [
    'You opened a chart and immediately became a data scientist.',
    'Big analyst energy. Shall I fetch your imaginary laser pointer?',
    'The graph cannot hear you saying “interesting,” but I can.',
    'You are one thoughtful nod away from a presentation.',
    'Looking at Insights counts as a board meeting, apparently.',
    'You inspect these charts like they know where your keys are.',
  ],
  you: [
    'You are rearranging settings like this is your interior-design era.',
    'Changing my outfit again? My tiny stylist has range.',
    'You came to personalise the app and accidentally adopted a dumpling.',
    'Another toggle. Your control-room era is really taking off.',
    'You have strong opinions about buttons. I feel professionally seen.',
    'You found roast mode. An entirely self-inflicted plot twist.',
  ],
}
export const POKE_ROASTS = [
  'Still me. Your investigation has made remarkable progress.',
  'You tap like there is a prize inside. There is only more sarcasm.',
  'The button you want is elsewhere. The employee you annoy is right here.',
  'You have promoted poking me from hobby to department.',
  'Yes, I am interactive. No, this is not a personality test.',
  'Tap again and I am putting “people skills” on my résumé.',
]
const ROAST_POSES: readonly TauntPose[] = ['bow', 'wave_at_user', 'look_around', 'tiny_dance']

export function pickRoast(
  screen: RoastScreen,
  seed = 0,
  recent: readonly string[] = [],
  moment: 'idle' | 'poke' = 'idle',
): RoastAct {
  const pool = [...GENERAL_ROASTS, ...SCREEN_ROASTS[screen], ...(moment === 'poke' ? POKE_ROASTS : [])]
  const unheard = pool.filter(line => !recent.includes(line))
  const candidates = unheard.length ? unheard : pool.filter(line => line !== recent[0])
  const variant = Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0
  return { line: candidates[variant % candidates.length]!, pose: ROAST_POSES[variant % ROAST_POSES.length]! }
}
