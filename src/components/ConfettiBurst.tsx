import { useEffect, useRef } from 'react'
import { useLottie } from 'lottie-react'
import confettiAnim from '@/assets/lottie/confetti.json'

export function ConfettiBurst({ fireKey }: { fireKey: number }) {
  const { View, play, stop } = useLottie(
    { animationData: confettiAnim, autoplay: false, loop: false, rendererSettings: { preserveAspectRatio: 'xMidYMid slice' } },
    { width: '100%', height: '100%' },
  )
  const prev = useRef(0)

  useEffect(() => {
    if (fireKey === 0 || fireKey === prev.current) return
    prev.current = fireKey
    stop()
    play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fireKey])

  return <div className="pointer-events-none fixed inset-0 z-[60]">{View}</div>
}
