interface LoadingRowsProps {
  label: string
  rows?: number
}

/** Skeleton-Zeilen in Zeilenhoehe der Tabelle/des Grids, damit kein Layout-Sprung entsteht (Design-System Screen 05). */
export function LoadingRows({ label, rows = 3 }: LoadingRowsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5 font-mono text-xs text-text-dim">
        <span className="h-2 w-2 bg-accent" />
        {label}
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="h-[38px] bg-[linear-gradient(90deg,var(--color-bg-raised)_0%,var(--color-bg-inset)_40%,var(--color-bg-raised)_80%)]"
          />
        ))}
      </div>
    </div>
  )
}
