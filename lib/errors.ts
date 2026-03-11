import { AxiosError } from "axios"
import { toast } from "sonner"

/** Extract a human-readable message from any thrown error */
export function getErrorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    return err.response?.data?.message || err.message || "Request failed"
  }
  if (err instanceof Error) return err.message
  return "An unexpected error occurred"
}

/**
 * Show a sonner error toast from any thrown value.
 * Use this in every catch block instead of manually formatting errors.
 *
 * @example
 * try { await api.post(...) } catch (err) { handleError(err) }
 */
export function handleError(err: unknown, fallback?: string): void {
  toast.error(fallback ?? getErrorMessage(err))
}
