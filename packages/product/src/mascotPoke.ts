export const POKE_POSES = [
  'poke_wobble',
  'poke_hop',
  'poke_squish',
  'poke_spin',
  'poke_puff',
  'poke_dizzy',
  'poke_tip',
  'poke_hide',
] as const

export type PokePose = (typeof POKE_POSES)[number]

export interface PokeAct {
  pose: PokePose
  line: string
}

const REPERTOIRE: PokeAct[] = [
  { pose: 'poke_wobble', line: 'Oh — hello there.' },
  { pose: 'poke_hop', line: 'Yes? I am right here.' },
  { pose: 'poke_squish', line: 'You are still poking.' },
  { pose: 'poke_spin', line: 'Whee. Right. Back to work.' },
  { pose: 'poke_puff', line: 'I am trying to look dignified.' },
  { pose: 'poke_dizzy', line: 'Now the room is moving. Thanks for that.' },
  { pose: 'poke_tip', line: 'This is my one job and you are interrupting it.' },
  { pose: 'poke_hide', line: 'I am not here. You saw nothing.' },
  { pose: 'poke_wobble', line: 'I have counted every one of these. Counting is my thing.' },
]

export function pokeAct(n: number): PokeAct {
  const i = Math.min(Math.max(1, Math.trunc(n)), REPERTOIRE.length) - 1
  return REPERTOIRE[i]!
}

export function pokeLines(): string[] {
  return REPERTOIRE.map(act => act.line)
}
