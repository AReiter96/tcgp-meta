interface AktualisierenButtonProps {
  onClick: () => void
  isLoading: boolean
  loadingLabel?: string
  className?: string
}

/**
 * Disabled-Zustand entsaettigt Rahmen/Text (border-line, text-faint) statt
 * Opacity auf den ganzen Button zu legen -- so vorgegeben im Design-System
 * (Screen 05 "AKTUALISIEREN-BUTTON").
 */
export function AktualisierenButton({
  onClick,
  isLoading,
  loadingLabel = 'Lädt…',
  className = '',
}: AktualisierenButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      className={`border font-mono text-[11px] tracking-[0.14em] uppercase px-3.5 py-2 transition-colors ${
        isLoading
          ? 'border-line bg-bg-raised text-text-faint cursor-not-allowed'
          : 'border-accent text-accent bg-transparent hover:bg-accent hover:text-accent-ink cursor-pointer'
      } ${className}`}
    >
      {isLoading ? loadingLabel : 'Aktualisieren'}
    </button>
  )
}
