import { motion } from 'framer-motion'

export function ScoreboardLocked() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      className="overflow-hidden rounded-[2rem] shadow-card ring-1 ring-black/10"
    >
      <img
        src="/banner-wunsch.png"
        alt="Wer gewinnt? Das Endergebnis bleibt spannend — es wird bei der Siegerehrung enthüllt."
        className="block h-auto w-full"
      />
    </motion.div>
  )
}
