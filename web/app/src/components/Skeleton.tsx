interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  circle?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, radius = 8, circle, className, style }: SkeletonProps) {
  return (
    <div
      className={`skeleton${className ? ` ${className}` : ''}`}
      aria-hidden
      style={{
        width,
        height,
        borderRadius: circle ? '50%' : radius,
        ...style,
      }}
    />
  )
}
