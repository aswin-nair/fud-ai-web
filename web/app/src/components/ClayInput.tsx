import type { InputHTMLAttributes } from 'react'

/** Inset clay field — pressed into the surface rather than raised out of it. */
export function ClayInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={['clay-input', className].filter(Boolean).join(' ')} {...rest} />
}
