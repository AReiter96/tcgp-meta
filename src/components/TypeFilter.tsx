interface TypeFilterProps {
  types: string[]
  value: string
  onChange: (value: string) => void
}

export function TypeFilter({ types, value, onChange }: TypeFilterProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label="Nach Typ filtern"
      className="rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
    >
      <option value="">Alle Typen</option>
      {types.map((type) => (
        <option key={type} value={type}>
          {type}
        </option>
      ))}
    </select>
  )
}
