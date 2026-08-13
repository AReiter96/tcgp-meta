import { useContext, useEffect } from 'react'
import {
  HeaderSlotSetterContext,
  HeaderSlotValueContext,
  type HeaderSlotContent,
} from './headerSlotContext'

/** Nur vom App-Shell gelesen, um die aktuell registrierten Slot-Inhalte im Topbar/Menue zu rendern. */
export function useHeaderSlotValue() {
  return useContext(HeaderSlotValueContext)
}

/**
 * Seiten registrieren hierueber ihre eigene Aktualisieren-Aktion (+ optionale
 * Meta-Zeile) in den globalen Topbar-Slot. setSlot kommt aus einem separaten
 * Context vom Slot-Wert selbst, damit ein Slot-Update nur den App-Shell
 * (Leser des Werts) neu rendert, nicht die aufrufende Seite selbst -- sonst
 * wuerde jede Seite bei jedem eigenen Update eine Render-Schleife ausloesen.
 */
export function useHeaderSlot(content: HeaderSlotContent | null) {
  const setSlot = useContext(HeaderSlotSetterContext)

  useEffect(() => {
    setSlot(content)
    return () => setSlot(null)
  })
}
