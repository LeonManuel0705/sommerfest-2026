import { motion } from 'framer-motion'

export function SkyBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'url(/sky.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <motion.img
        src="/clouds-cut.png"
        alt=""
        className="absolute top-[6%] left-0 w-[150%] max-w-none opacity-60"
        initial={{ x: '-14%' }}
        animate={{ x: '-2%' }}
        transition={{ duration: 48, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(245,250,252,0.5) 0%, rgba(245,250,252,0.22) 36%, rgba(245,250,252,0.46) 100%)' }}
      />
    </div>
  )
}
