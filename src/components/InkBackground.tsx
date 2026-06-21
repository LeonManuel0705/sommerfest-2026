export function InkBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #fbfdfb 0%, #eef6ef 55%, #e3f0e6 100%)' }}
    >
      <div
        className="absolute left-1/2 top-[-28%] h-[70vmax] w-[100vmax] -translate-x-1/2"
        style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.14), rgba(16,185,129,0.04) 45%, transparent 72%)' }}
      />
      <div
        className="absolute -right-[8%] top-[-6%] h-[45vmax] w-[45vmax]"
        style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.1), transparent 65%)' }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(16,120,80,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(16,120,80,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at 50% 25%, #000 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 25%, #000 35%, transparent 80%)',
        }}
      />
      <img
        src="/ehg-logo.png"
        aria-hidden
        className="absolute top-1/2 left-1/2 w-[38%] max-w-lg -translate-x-1/2 -translate-y-1/2 opacity-[0.05] grayscale"
      />
    </div>
  )
}
