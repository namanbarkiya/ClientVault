"use client"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { LayoutTemplate, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { templatesApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { handleError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Template } from "@/types/clientvault"

const NULL_UUID = "00000000-0000-0000-0000-000000000000"

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const { data: templates, isLoading } = useQuery({
    queryKey: queryKeys.clientvault.templates.list(),
    queryFn: templatesApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: templatesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.templates.list() })
      toast.success("Template deleted")
      setDeleteTarget(null)
    },
    onError: (err) => handleError(err),
  })

  const createMutation = useMutation({
    mutationFn: templatesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.templates.list() })
      toast.success("Template created")
      setCreateOpen(false)
    },
    onError: (err) => handleError(err),
  })

  const builtins = templates?.filter((t) => t.user_id === NULL_UUID) ?? []
  const custom = templates?.filter((t) => t.user_id !== NULL_UUID) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground text-sm">Reusable content request presets</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {builtins.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Starter Templates
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {builtins.map((t) => (
                  <TemplateCard key={t.id} template={t} isBuiltin />
                ))}
              </div>
            </section>
          )}

          {custom.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                My Templates
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {custom.map((t) => (
                  <TemplateCard key={t.id} template={t} onDelete={() => setDeleteTarget(t)} />
                ))}
              </div>
            </section>
          )}

          {custom.length === 0 && builtins.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <LayoutTemplate className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-medium">No templates yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Create templates to quickly set up content requests for new projects.
              </p>
            </div>
          )}
        </>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create template dialog */}
      <CreateTemplateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />
    </div>
  )
}

function TemplateCard({
  template, isBuiltin = false, onDelete,
}: {
  template: Template
  isBuiltin?: boolean
  onDelete?: () => void
}) {
  const totalItems = template.sections.reduce((acc, s) => acc + s.items.length, 0)
  return (
    <Card className="group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm">{template.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {template.sections.length} sections · {totalItems} items
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {isBuiltin && (
              <Badge variant="secondary" className="text-xs">Built-in</Badge>
            )}
            {!isBuiltin && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {template.sections.slice(0, 3).map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
              <span className="truncate">{s.title}</span>
            </div>
          ))}
          {template.sections.length > 3 && (
            <p className="text-xs text-muted-foreground pl-3">+{template.sections.length - 3} more</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function CreateTemplateDialog({
  open, onClose, onSubmit, loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: { name: string; sections: Template["sections"] }) => void
  loading: boolean
}) {
  const [name, setName] = useState("")

  function handleSubmit() {
    if (!name.trim()) return
    onSubmit({ name: name.trim(), sections: [] })
    setName("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create Template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Template name</Label>
            <Input
              placeholder="My Custom Template"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Create a blank template, then apply it to a project and add sections and items there.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
