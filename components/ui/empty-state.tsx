import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center gap-3", className)}>
      {Icon && (
        <div className="rounded-full bg-muted p-4 mb-1">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-medium text-sm">{title}</p>
        {description && <p className="text-muted-foreground text-sm max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  )
}
