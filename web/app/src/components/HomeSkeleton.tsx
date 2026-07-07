import { Skeleton } from './Skeleton'

export function HomeSkeleton() {
  return (
    <div className="home-skeleton" aria-hidden>
      <div className="home-skeleton-week">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="home-skeleton-day">
            <Skeleton width={12} height={9} radius={3} />
            <Skeleton width={34} height={34} circle />
          </div>
        ))}
      </div>

      <div className="home-skeleton-ring-wrap">
        <Skeleton width={190} height={190} circle />
        <Skeleton width={110} height={12} radius={6} style={{ marginTop: 14 }} />
      </div>

      <div className="home-skeleton-chips">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width={64} height={56} radius={16} />
        ))}
      </div>

      <div className="home-skeleton-macros">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="home-skeleton-macro-card">
            <Skeleton width={46} height={22} radius={11} />
            <Skeleton width="100%" height={5} radius={3} style={{ marginTop: 12 }} />
            <Skeleton width={38} height={9} radius={4} style={{ marginTop: 8 }} />
          </div>
        ))}
      </div>

      <div className="home-skeleton-food">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="home-skeleton-food-row">
            <Skeleton width={40} height={40} circle />
            <div className="home-skeleton-food-lines">
              <Skeleton width="58%" height={12} radius={4} />
              <Skeleton width="38%" height={10} radius={4} style={{ marginTop: 7 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
