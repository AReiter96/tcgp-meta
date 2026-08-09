import { afterEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useOnlineStatus } from './useOnlineStatus'

function setNavigatorOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

afterEach(() => {
  setNavigatorOnLine(true)
})

describe('useOnlineStatus', () => {
  it('reflects the initial navigator.onLine value', () => {
    setNavigatorOnLine(false)

    const { result } = renderHook(() => useOnlineStatus())

    expect(result.current).toBe(false)
  })

  it('updates to false when an offline event fires', () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('updates to true when an online event fires', () => {
    setNavigatorOnLine(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })
})
