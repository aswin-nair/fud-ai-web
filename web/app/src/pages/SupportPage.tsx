import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { BottomNav } from '../components/BottomNav'
import { BackLink } from '../components/BackLink'
import { IconArrowUpRight } from '../components/icons'
import { track } from '../lib/analytics'

/**
 * §2.8. Deliberately plain: no imagery, no mascot, no encouragement copy.
 *
 * NEDA is intentionally absent — its helpline was retired and the number no
 * longer reaches a person. Sending someone in difficulty to a dead line is
 * worse than not listing one, so the US entry is the National Alliance for
 * Eating Disorders, which is staffed by licensed clinicians.
 */

interface Helpline {
  region: string
  name: string
  phone: string
  /** Digits for the tel: link, which cannot carry spaces or dashes. */
  dial: string
  detail: string
  url: string
}

const HELPLINES: Helpline[] = [
  {
    region: 'United States',
    name: 'National Alliance for Eating Disorders',
    phone: '1-866-662-1235',
    dial: '+18666621235',
    detail: 'Answered by licensed therapists, weekdays.',
    url: 'https://www.allianceforeatingdisorders.com',
  },
  {
    region: 'United Kingdom',
    name: 'Beat',
    phone: '0808 801 0677',
    dial: '+448088010677',
    detail: 'Helpline, webchat and one-to-one support.',
    url: 'https://www.beateatingdisorders.org.uk',
  },
  {
    region: 'Australia',
    name: 'Butterfly Foundation',
    phone: '1800 33 4673',
    dial: '+611800334673',
    detail: 'Counsellors available seven days a week.',
    url: 'https://butterfly.org.au',
  },
]

export function SupportPage() {
  useEffect(() => track({ name: 'support_opened' }), [])

  return (
    <div className="app-shell">
      <main className="app-main">
        <BackLink to="/settings" />
        <h1 className="screen-title" style={{ marginTop: 12 }}>Support</h1>

        <div className="progress-card">
          <p className="about-lead">
            If food, eating or your body is feeling heavy, talking to someone
            helps more than any tracker can. These lines are free and
            confidential.
          </p>
        </div>

        {HELPLINES.map(line => (
          <div className="progress-card" key={line.region}>
            <p className="support-region">{line.region}</p>
            <p className="support-name">{line.name}</p>
            <a className="support-phone" href={`tel:${line.dial}`}>{line.phone}</a>
            <p className="support-detail">{line.detail}</p>
            <a
              className="about-link-row"
              href={line.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>Visit website</span>
              <span className="about-chevron"><IconArrowUpRight size={15} /></span>
            </a>
          </div>
        ))}

        <div className="progress-card">
          <p className="support-region">In immediate danger</p>
          <p className="support-detail">
            Call your local emergency number. In the US you can also call or
            text 988 for the Suicide and Crisis Lifeline.
          </p>
        </div>

        <div className="progress-card">
          <p className="support-detail">
            You can also step away from the numbers without losing your streak.
          </p>
          <Link className="about-link-row" to="/settings">
            <span>Pause tracking</span>
            <span className="about-chevron"><IconArrowUpRight size={15} /></span>
          </Link>
        </div>

        <p className="about-version">
          Fud AI is a habit tracker, not a medical tool.
        </p>
      </main>
      <BottomNav />
    </div>
  )
}
