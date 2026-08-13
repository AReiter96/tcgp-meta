interface CardSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function CardSearchBar({ value, onChange }: CardSearchBarProps) {
  return (
    <div className="flex flex-1 items-center gap-2.5 border border-line-strong px-3.5">
      <span className="font-mono text-xs text-accent">/</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Karte suchen…"
        aria-label="Karte suchen"
        className="h-11 w-full bg-transparent text-sm text-text placeholder:text-text-faint focus:outline-none"
      />
    </div>
  )
}
