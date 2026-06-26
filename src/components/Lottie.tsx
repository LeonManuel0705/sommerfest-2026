import { useLottie } from 'lottie-react'

const FILL = { width: '100%', height: '100%' }

export function LottieLoop({ data, className }: { data: unknown; className?: string }) {
  const { View } = useLottie({ animationData: data as object, loop: true, autoplay: true }, FILL)
  return <div className={className}>{View}</div>
}

export function LottieOnce({ data, className, onComplete }: { data: unknown; className?: string; onComplete?: () => void }) {
  const { View } = useLottie({ animationData: data as object, loop: false, autoplay: true, onComplete }, FILL)
  return <div className={className}>{View}</div>
}
