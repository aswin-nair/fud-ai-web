/**
 * Everything Momo can say. Data only — the picking logic lives in mascotVoice.ts.
 *
 * ── The voice ────────────────────────────────────────────────
 * Dry and understated. He is a clerk who keeps a tally, not a cheerleader. He
 * is pleased when you show up and entirely unbothered when you do not. He can
 * be put-upon about being poked and faintly proud of his own record-keeping.
 *
 * He never comments on food, a body, a number, or how much of anything there
 * was. Not because he is being tactful — because he genuinely cannot see it.
 * §3.5 keeps the numbers away from him and that is the whole character.
 *
 * ── Writing a new line ───────────────────────────────────────
 * Short. One or two clauses. No exclamation marks outside `celebrating`.
 * Never nag, never imply a debt, never congratulate a quantity.
 *
 * Banned outright, and enforced by mascotVoice.test.ts:
 *   bad · cheat · guilty · earned · naughty · sinful · damage · burn it off
 *   calorie · kcal · weight · fat · skinny · lazy · greedy · diet · deficit
 *   over · under · too much · too little
 *   stupid · idiot · useless · pathetic · failure · loser · shame · disgusting
 *   any digit
 *
 * `over` and `under` catch people out — "all over again", "under way" and
 * "start over" are all rejected. Reach for another phrasing.
 */

import type { MascotState, PokePose, TauntPose } from './mascotVoice'

/** Keyed to the logging-driven states. Never to intake. */
export const AMBIENT: Record<MascotState, string[]> = {
  /* Nothing logged yet. Patient to the point of being unhelpable — the one
     thing this pool must never do is push. */
  sleepy: [
    'Nothing logged yet. One meal is enough to keep the day.',
    'Whenever you are ready — anything counts.',
    'Still here. No rush.',
    'A quick add counts just as much as a proper one.',
    'I will be here when you get to it.',
    'No hurry from me. I have nowhere to be.',
    'The tally is empty and entirely patient.',
    'One entry. That is the whole ask.',
    'I have the pen ready whenever you are.',
    'Nothing yet, and that is fine.',
    'Take your time. The day is long.',
    'I am not going anywhere.',
    'Whenever. Truly.',
    'The page is blank and quite relaxed about it.',
    'Say the word and I will write it down.',
    'Still waiting, still content.',
  ],
  idle: [
    'Today is on the board.',
    'Logged and counted. Nice.',
    'That is the hard part done.',
    'I will keep the tally. You get on with things.',
    'On the board. Nothing else needed.',
    'Counted. Carry on.',
    'The day is written down. Good.',
    'Noted. That is my part done.',
    'It is in the book.',
    'Recorded. You may go about your business.',
    'That is today accounted for.',
    'Filed neatly, if I say so myself.',
    'The tally is content.',
    'One in the ledger. Tidy.',
    'Written down and safe.',
    'Done and dusted.',
  ],
  happy: [
    'That one is in.',
    'Got it — day secured.',
    'Noted and filed.',
    'In it goes.',
    'Safely on the list.',
    'Down it goes in the book.',
    'Caught that one.',
    'Added. Neatly.',
    'That is on the page now.',
    'Right, noted.',
    'Straight into the tally.',
    'Another one recorded.',
    'Got there. Good.',
    'Logged. Lovely.',
    'Onto the pile it goes.',
    'Marked down.',
  ],
  /* The only pool allowed an exclamation mark, and only just. */
  celebrating: [
    'Day made!',
    'That builds your rhythm.',
    'That is the shape of it.',
    'Rhythm intact.',
    'Well now. Look at that.',
    'That is the day, done properly.',
    'Splendid.',
    'A tidy day, start to finish.',
    'That is what showing up looks like.',
    'I am quietly delighted.',
    'Marvellous work.',
    'The whole day, accounted for.',
    'That went well.',
    'A good one. Genuinely.',
    'Rhythm kept.',
    'Nicely done, all of it.',
  ],
  /* Respect, not gushing. He has watched this happen and says so plainly. */
  proud: [
    'Look at that streak.',
    'You have kept this going a while now.',
    'This is starting to look like a habit.',
    'You keep turning up. I notice.',
    'A run like that is not an accident.',
    'That is a proper run.',
    'Consistency suits you.',
    'I have watched this build.',
    'Day after day. Quietly impressive.',
    'This is who you are now, apparently.',
    'A long line of showing up.',
    'The streak speaks for itself.',
    'You have made this ordinary. That is the trick.',
    'Still going. Still counting.',
    'Habit territory, this.',
    'I keep the tally and the tally is long.',
  ],
  /* Tracking paused: the numbers are hidden, so he is reassuring and idle.
     Nothing here may imply anything is slipping, because nothing is. */
  neutral: [
    'Tracking is paused. Your streak is held.',
    'Numbers are off. Nothing is slipping.',
    'Paused, and holding steady.',
    'All held where you left it.',
    'Nothing is running down. Rest easy.',
    'The tally is on hold, safely.',
    'Paused. I am just keeping the seat warm.',
    'Everything stays as it is.',
    'On hold, and quite safe.',
    'No counting today. That is allowed.',
    'Held. Come back whenever.',
    'Nothing to do here. That is the point.',
    'Resting. Both of us.',
    'Your place is kept.',
    'Paused, not lost.',
    'Quietly waiting, nothing ticking.',
  ],
}

/**
 * Back after a gap. The most safety-sensitive pool in the file: the streak
 * rules already forgive absence, so not one of these may imply a debt, a
 * lapse, or ground to make up.
 */
export const RETURNING = [
  'There you are. Picking up where we left off.',
  'Back again. The tally missed you.',
  'Welcome back. Nothing to catch up on — just today.',
  'Good to see you. We start from here.',
  'You are back. That is the whole thing.',
  'Hello again. Straight on as though nothing happened.',
  'Returning is the hard bit and you have done it.',
  'No ground to make up. Just today.',
  'The book was waiting. So was I.',
  'Back in the chair. Good.',
  'We resume. Simple as that.',
  'Nothing is held against you here.',
  'Right where we left it.',
  'You came back. That counts for a lot.',
]

/**
 * The day ring is closed. Phrased as a standing state rather than "just now" —
 * the caller knows the ring is complete, not the moment it completed, and a
 * mascot saying "just closed" four hours later is a small lie.
 */
export const RING_COMPLETE = [
  'The ring is closed.',
  'That is the whole shape, done.',
  'All the way round. Nothing left to do.',
  'Closed. A satisfying shape, that.',
  'Round it goes, and shut.',
  'A complete circle. Very tidy.',
  'That is the full round.',
  'Shut, sealed, done.',
  'The circle holds.',
  'Nothing left open.',
  'Whole. That is a good word for it.',
  'Every part of it, seen to.',
  'The shape is finished.',
  'Closed up for the day.',
]

/** The first log of the day — the one that keeps the streak. */
export const FIRST_LOG = [
  'First one in. The day is safe.',
  'That is today held.',
  'One down. That is the streak kept.',
  'Day opened. The rest is yours.',
  'The first is the one that matters.',
  'Today is on the books now.',
  'That is the day begun properly.',
  'One entry and the day is yours.',
  'Opened the page. Good start.',
  'The streak is safe for today.',
  'First mark on a clean page.',
  'That is the day claimed.',
  'Started. That was the hard part.',
  'The day counts now.',
]

/** Small hours. Companionable and present — never a remark about eating late. */
export const LATE_NIGHT = [
  'Late one. I am still up too.',
  'Quiet hours. I will keep it down.',
  'Still here, keeping the tally.',
  'The counting does not stop for the hour.',
  'Small hours. Companionable, this.',
  'The house is quiet. So am I.',
  'Late, but the book is open.',
  'I do not mind the hour.',
  'Everyone else is asleep. Not us.',
  'A quiet time to write things down.',
  'Still awake, still counting.',
  'The night shift, then.',
  'No judgement about the hour from me.',
  'Late and perfectly fine.',
]

/**
 * The escalation ladder used by the roaming mascot. Positional: poke three is
 * always the third rung, so this list stays eight long. New wording belongs in
 * REPERTOIRE below, which varies by session.
 */
export const POKES = [
  'Oh — hello.',
  'Yes? I am right here.',
  'You are still poking.',
  'This is my one job and you are interrupting it.',
  'I do have a tally to keep.',
  'Fine. Poke away. I will wait.',
  'We are really doing this.',
  'I have counted every one of these, you know. Counting is my thing.',
]

/**
 * Waking him up. Short on purpose — a sleepy Momo works through these before
 * joining the escalation, so a long list would mean a long, dull wake-up.
 */
export const WOKEN = [
  'Hm? Oh. You are back.',
  'I was resting my eyes.',
  'Right. Awake. Present.',
  'Hm? Awake. Mostly.',
]

/**
 * Volunteer asides for the roaming mascot. Each pool is written for the
 * gesture named by its key, so the line and the movement land as one small
 * joke. These are deliberately about Momo, the interface, and his imaginary
 * paperwork — never about anything the user logged.
 */
export const TAUNTS: Record<TauntPose, string[]> = {
  wave_at_user: [
    'There you are. I was pretending not to notice.',
    'A tiny wave. Budget approved.',
    'Hello again. My public awaits.',
    'I waved first. The records will show this.',
    'A formal greeting from the tally department.',
    'Consider yourself acknowledged.',
    'I saw you looking. This seemed appropriate.',
    'Welcome. I have been practising that.',
  ],
  look_around: [
    'I am supervising. Very intensely.',
    'Nothing suspicious here. Carry on.',
    'I have reviewed the situation. It remains a screen.',
    'The interface and I are having creative differences.',
    'I was being productive until you looked.',
    'You caught me doing absolutely nothing.',
    'I had a plan. It was mostly standing here.',
    'A dramatic pause. Entirely intentional.',
  ],
  stretch: [
    'I stretched. Productivity is exhausting.',
    'A brief reset. Very official.',
    'Even clerks require a little ceremony.',
    'That was important administrative movement.',
    'Limbered up and ready to file things.',
    'A grand gesture for a very small occasion.',
    'Back to work. Heroically, if anyone asks.',
    'Composure restored. More or less.',
  ],
}

export interface PokeBeat {
  pose: PokePose
  lines: string[]
}

/**
 * The poke repertoire: an escalating arc from polite surprise to thoroughly
 * put-upon, settling on the counting joke rather than looping back to pleased.
 *
 * The pose ladder is the shape of the gag and must not move. The lines vary by
 * session so the fourth poke is recognisably the fourth without being a recital.
 *
 * Two beats are pinned by tests: every line in the first must greet, and every
 * line in the last must be about counting.
 */
export const REPERTOIRE: PokeBeat[] = [
  { pose: 'poke_wobble', lines: [
    'Oh — hello there.',
    'Oh. Hello.',
    'Well. Hello to you too.',
    'Hello. You startled me.',
    'Hello there. Can I help?',
  ] },
  { pose: 'poke_hop', lines: [
    'Yes? I am right here.',
    'Present. Very present.',
    'Right here, as always.',
    'Yes. Still standing here.',
    'You have my attention.',
  ] },
  { pose: 'poke_squish', lines: [
    'You are still poking.',
    'Still poking, I see.',
    'That is twice now. Three times?',
    'We are doing this again.',
    'Another one. Noted.',
  ] },
  { pose: 'poke_spin', lines: [
    'Whee. Right. Back to work.',
    'Round I go. Marvellous.',
    'Spun. Thank you for that.',
    'A full turn. Delightful.',
    'And around. Lovely.',
  ] },
  { pose: 'poke_puff', lines: [
    'I am trying to look dignified.',
    'There is a dignity to this job, you know.',
    'I had composure a moment ago.',
    'This is not a dignified position.',
    'I do have standards.',
  ] },
  { pose: 'poke_dizzy', lines: [
    'Now the room is moving. Thanks for that.',
    'Everything is tilting. Lovely.',
    'I will just wait for the room to settle.',
    'The floor has opinions now.',
    'Give me a moment. The room is busy.',
  ] },
  { pose: 'poke_tip', lines: [
    'This is my one job and you are interrupting it.',
    'One job. I have one job.',
    'I was in the middle of something.',
    'There is work happening here, you know.',
    'You are making this difficult.',
  ] },
  { pose: 'poke_hide', lines: [
    'I am not here. You saw nothing.',
    'Gone. Nobody here.',
    'You cannot see me.',
    'This is me, hiding.',
    'Nothing to see. Move along.',
  ] },
  { pose: 'poke_wobble', lines: [
    'I have counted every one of these. Counting is my thing.',
    'That is another one counted. It is what I do.',
    'Counted. I count things. This too.',
    'I am counting these, you realise.',
    'Every poke, counted. It is a gift.',
  ] },
]
