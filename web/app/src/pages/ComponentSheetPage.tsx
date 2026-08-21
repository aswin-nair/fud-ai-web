import { Counter } from '../components/Counter'
import { PathNode } from '../components/PathNode'
import { PressableButton } from '../components/PressableButton'
import { Surface } from '../components/Surface'

/** Dev-only primitive mount. Not a production route. */
export function ComponentSheetPage() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <h1 className="page-title">Primitives</h1>
        <p className="eyebrow">Surface</p>
        <Surface>
          <p>Chunky card</p>
        </Surface>
        <p className="eyebrow">Buttons</p>
        <PressableButton label="Primary" />
        <PressableButton variant="secondary" label="Secondary" />
        <PressableButton variant="ghost" label="Ghost" />
        <PressableButton variant="destructive" label="Delete" />
        <p className="eyebrow">Counters</p>
        <div className="home-counter-row">
          <Counter label="days" value={7} tone="streak" />
          <Counter label="xp" value={120} tone="xp" />
          <Counter label="freezes" value={2} tone="freeze" />
        </div>
        <p className="eyebrow">Path nodes</p>
        <div className="meal-path-nodes">
          <PathNode slot="breakfast" status="done" />
          <PathNode slot="lunch" status="current" mascot />
          <PathNode slot="dinner" status="later" />
        </div>
      </main>
    </div>
  )
}
