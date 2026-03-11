import { useState } from "react"
import { toast } from "sonner"

export function useCopy(timeout = 2000) {
  const [copied, setCopied] = useState(false)

  async function copy(text: string, successMessage = "Copied!") {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea")
      el.value = text
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
    }
    setCopied(true)
    toast.success(successMessage)
    setTimeout(() => setCopied(false), timeout)
  }

  return { copy, copied }
}
