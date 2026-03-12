"use client"
import Link from "next/link"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Copy, ExternalLink, FolderOpen, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { projectsApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { handleError } from "@/lib/errors"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/clientvault"

const STATUS_FILTERS = ["all", "active", "completed", "archived"] as const

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
  const qc = useQueryClient()

  const { data: projects, isLoading } = useQuery({
    queryKey: queryKeys.clientvault.projects.list(statusFilter),
    queryFn: () => projectsApi.list(statusFilter === "all" ? undefined : statusFilter),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientvault", "projects"] })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.dashboard() })
      toast.success("Project archived")
      setDeleteTarget(null)
    },
    onError: (err) => handleError(err),
  })

  function copyPortalLink(token: string) {
    const url = `${window.location.origin}/portal/${token}`
    navigator.clipboard.writeText(url)
    toast.success("Portal link copied")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">Manage your client content collection projects</p>
        </div>
        <Link href="/projects/new" className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              statusFilter === f
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !projects?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-lg font-medium">No projects found</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs">
            {statusFilter === "all"
              ? "Create your first project to start collecting assets from clients."
              : `No ${statusFilter} projects.`}
          </p>
          {statusFilter === "all" && (
            <Link href="/projects/new" className={cn(buttonVariants(), "mt-4")}>
              <Plus className="h-4 w-4" />
              Create project
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold"
                      style={{ backgroundColor: p.branding_color ?? "#6366f1" }}
                    >
                      {p.client_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-sm font-semibold hover:underline line-clamp-1"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{p.client_name}</p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon" }),
                        "h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100"
                      )}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Link href={`/projects/${p.id}`} className="flex items-center gap-2 w-full">
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Link>
                      </DropdownMenuItem>
                      {p.portal_token && (
                        <DropdownMenuItem onClick={() => copyPortalLink(p.portal_token!)}>
                          <Copy className="h-4 w-4" />
                          Copy portal link
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.submitted_items} / {p.total_items} items</span>
                    <span>{p.completion_percent}%</span>
                  </div>
                  <Progress value={p.completion_percent} className="h-1.5" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={p.status} />
                  {p.due_date && (
                    <span className="text-xs text-muted-foreground">
                      Due {new Date(p.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive project?</DialogTitle>
            <DialogDescription>
              This will archive <strong>{deleteTarget?.name}</strong>. It won't be deleted but will be hidden from active projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    archived: "bg-muted text-muted-foreground",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${map[status] ?? map.active}`}>
      {status}
    </span>
  )
}
