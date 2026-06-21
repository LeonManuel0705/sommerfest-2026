export function Watermark() {
  return (
    <img
      src="/ehg-logo.png"
      aria-hidden
      className="pointer-events-none fixed top-1/2 left-1/2 -z-[1] w-[52%] max-w-xl -translate-x-1/2 -translate-y-1/2 opacity-[0.045] grayscale"
    />
  )
}
