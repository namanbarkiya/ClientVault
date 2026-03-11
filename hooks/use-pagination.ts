import { useState } from "react"

interface UsePaginationOptions {
  totalItems: number
  pageSize?: number
  initialPage?: number
}

export function usePagination({ totalItems, pageSize = 20, initialPage = 1 }: UsePaginationOptions) {
  const [page, setPage] = useState(initialPage)

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const offset = (page - 1) * pageSize

  function next() { setPage((p) => Math.min(p + 1, totalPages)) }
  function prev() { setPage((p) => Math.max(p - 1, 1)) }
  function goTo(p: number) { setPage(Math.max(1, Math.min(p, totalPages))) }
  function reset() { setPage(1) }

  return { page, totalPages, offset, pageSize, next, prev, goTo, reset, hasNext: page < totalPages, hasPrev: page > 1 }
}
