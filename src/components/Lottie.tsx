import { useMemo } from 'react'
import { useLottie } from 'lottie-react'

const FILL = { width: '100%', height: '100%' }

function useFresh(data: unknown) {
  return useMemo(() => JSON.parse(JSON.stringify(data)) as object, [data])
}

export function LottieLoop({ data, className }: { data: unknown; className?: string }) {
  const animationData = useFresh(data)
  const { View } = useLottie({ animationData, loop: true, autoplay: true }, FILL)
  return <div className={className}>{View}</div>
}

export function LottieOnce({ data, className, onComplete }: { data: unknown; className?: string; onComplete?: () => void }) {
  const animationData = useFresh(data)
  const { View } = useLottie({ animationData, loop: false, autoplay: true, onComplete }, FILL)
  return <div className={className}>{View}</div>
}
