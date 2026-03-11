import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCompact } from "@/lib/format"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon?: LucideIcon
  trend?: { value: number; label?: string }
  className?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  const displayValue = typeof value === "number" ? formatCompact(value) : value
  const trendPositive = trend && trend.value >= 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-bold tracking-tight">{displayValue}</p>
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn("text-xs font-medium", trendPositive ? "text-green-600" : "text-red-500")}>
              {trendPositive ? "+" : ""}{trend.value}%
            </span>
          )}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
