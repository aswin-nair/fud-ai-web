let stream: MediaStream | null = null
let pending: Promise<MediaStream | null> | null = null

/** Best-effort camera warm-up. Never claimed as a 5s guarantee. */
export function preloadCamera(): void {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
  if (stream || pending) return
  pending = navigator.mediaDevices
    .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false })
    .then(next => {
      stream = next
      return next
    })
    .catch(() => null)
    .finally(() => { pending = null })
}

export function releaseCamera(): void {
  stream?.getTracks().forEach(track => track.stop())
  stream = null
  pending = null
}
