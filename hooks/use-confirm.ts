"use client"
import { useState } from "react"

/**
 * Simple confirmation state hook.
 * Usage: const { confirm, isConfirming, cancel } = useConfirm()
 * First click sets isConfirming=true. Second click calls the action.
 */
export function useConfirm(action: () => void, resetDelay = 3000) {
  const [isConfirming, setIsConfirming] = useState(false)

  function confirm() {
    if (!isConfirming) {
      setIsConfirming(true)
      setTimeout(() => setIsConfirming(false), resetDelay)
    } else {
      setIsConfirming(false)
      action()
    }
  }

  function cancel() {
    setIsConfirming(false)
  }

  return { confirm, cancel, isConfirming }
}
