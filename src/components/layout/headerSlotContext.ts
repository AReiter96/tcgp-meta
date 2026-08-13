import { createContext, type ReactNode } from 'react'

export interface HeaderSlotContent {
  action?: ReactNode
  meta?: ReactNode
}

export type SetHeaderSlot = (slot: HeaderSlotContent | null) => void

export const HeaderSlotValueContext = createContext<HeaderSlotContent | null>(
  null,
)
export const HeaderSlotSetterContext = createContext<SetHeaderSlot>(() => {})
