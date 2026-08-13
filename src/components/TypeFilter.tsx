interface TypeFilterProps {
  types: string[]
  value: string
  onChange: (value: string) => void
}

export function TypeFilter({ types, value, onChange }: TypeFilterProps) {
  return (
    <div
      role="group"
      aria-label="Nach Typ filtern"
      className="flex gap-1.5 overflow-x-auto"
    >
      <TypeChip
        label="ALLE"
        active={value === ''}
        onClick={() => onChange('')}
      />
      {types.map((type) => (
        <TypeChip
          key={type}
          label={type}
          active={value === type}
          onClick={() => onChange(type)}
        />
      ))}
    </div>
  )
}

function TypeChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex-none px-2.5 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase ${
        active
          ? 'bg-accent text-accent-ink'
          : 'border border-line-strong text-text-dim hover:text-text'
      }`}
    >
      {label}
    </button>
  )
}
