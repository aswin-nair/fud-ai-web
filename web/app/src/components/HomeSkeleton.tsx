import { Skeleton } from './Skeleton'

export function HomeSkeleton() {
  return (
    <div className="home-skeleton" aria-hidden>
      <div className="home-skeleton-chips">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} width="100%" height={44} radius={16} />
        ))}
      </div>
      <div className="home-skeleton-path">
        <Skeleton width="40%" height={36} radius={8} />
        <Skeleton width="100%" height={180} radius={26} style={{ marginTop: 12 }} />
      </div>
      <div className="home-skeleton-macros">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="home-skeleton-macro-card">
            <Skeleton width={46} height={12} radius={6} />
            <Skeleton width="100%" height={7} radius={3} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
