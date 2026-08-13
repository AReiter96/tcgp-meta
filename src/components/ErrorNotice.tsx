interface ErrorNoticeProps {
  message: string
  detail?: string
  onRetry?: () => void
}

/** Fehlerzustand nutzt den Kontrastakzent (pink), kein fremdes Rot -- bleibt im Farbsystem (Design-System Screen 05). */
export function ErrorNotice({ message, detail, onRetry }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-1.5 border-l-2 border-contrast bg-[#170D14] px-3.5 py-3"
    >
      <div className="font-mono text-[11px] tracking-[0.14em] text-contrast">
        FEHLER
      </div>
      <div className="text-[13px] leading-snug text-[#FFC7EA]">{message}</div>
      {detail && (
        <div className="font-mono text-[10px] text-[#9E7B90]">{detail}</div>
      )}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 self-start border border-contrast px-3 py-2 font-mono text-[11px] tracking-[0.14em] text-contrast uppercase hover:bg-contrast hover:text-contrast-ink"
        >
          Erneut versuchen
        </button>
      )}
    </div>
  )
}
