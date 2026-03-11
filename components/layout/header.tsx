"use client"

import { usePathname } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"

function getBreadcrumb(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop() ?? "dashboard"
  return segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function DashboardHeader() {
  const pathname = usePathname()
  const page = getBreadcrumb(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <span className="text-sm font-medium">{page}</span>
    </header>
  )
}
