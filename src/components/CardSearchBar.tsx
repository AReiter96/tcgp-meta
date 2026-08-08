interface CardSearchBarProps {
  value: string
  onChange: (value: string) => void
}

export function CardSearchBar({ value, onChange }: CardSearchBarProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Karte suchen..."
      aria-label="Karte suchen"
      className="w-full rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
    />
  )
}
