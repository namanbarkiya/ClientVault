"use client"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, CheckCircle2, Clock, FolderOpen, Plus, TrendingUp } from "lucide-react"

import { dashboardApi, projectsApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: queryKeys.clientvault.dashboard(),
    queryFn: dashboardApi.stats,
  })

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: queryKeys.clientvault.projects.list(),
    queryFn: () => projectsApi.list(),
  })

  const recentProjects = projects?.slice(0, 5) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back, {user?.full_name || user?.email}
          </p>
        </div>
        <Link href="/projects/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <StatCard
              title="Active Projects"
              value={stats?.active_projects ?? 0}
              icon={<FolderOpen className="h-4 w-4 text-blue-500" />}
            />
            <StatCard
              title="Pending Items"
              value={stats?.total_pending_items ?? 0}
              icon={<Clock className="h-4 w-4 text-orange-500" />}
              valueClass="text-orange-600"
            />
            <StatCard
              title="Submitted Items"
              value={stats?.total_submitted_items ?? 0}
              icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
              valueClass="text-green-600"
            />
            <StatCard
              title="Overall Completion"
              value={`${stats?.overall_completion_percent ?? 0}%`}
              icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
            />
          </>
        )}
      </div>

      {/* Recent projects */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Recent Projects</CardTitle>
          <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {projectsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No projects yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create your first project to start collecting content from clients.
              </p>
              <Link href="/projects/new" className={cn(buttonVariants({ size: "sm" }), "mt-4 inline-flex")}>
                <Plus className="h-3 w-3" />
                Create project
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                    style={{ backgroundColor: p.branding_color ?? "#6366f1" }}
                  >
                    {p.client_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.client_name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-16">
                      <Progress value={p.completion_percent} className="h-1.5" />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {p.completion_percent}%
                    </span>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title, value, icon, valueClass = "",
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  valueClass?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    active: { label: "Active", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: { label: "Done", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    archived: { label: "Archived", class: "bg-muted text-muted-foreground" },
  }
  const s = map[status] ?? map.active
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${s.class}`}>
      {s.label}
    </span>
  )
}
