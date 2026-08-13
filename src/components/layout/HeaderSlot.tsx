import { useState, type ReactNode } from 'react'
import {
  HeaderSlotSetterContext,
  HeaderSlotValueContext,
  type HeaderSlotContent,
} from './headerSlotContext'

export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HeaderSlotContent | null>(null)

  return (
    <HeaderSlotSetterContext.Provider value={setSlot}>
      <HeaderSlotValueContext.Provider value={slot}>
        {children}
      </HeaderSlotValueContext.Provider>
    </HeaderSlotSetterContext.Provider>
  )
}
