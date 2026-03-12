"use client"
import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  ArrowLeft, Bell, CheckCircle2, ChevronDown, ChevronRight,
  Copy, ExternalLink, FileText, Link2, Lock, Plus,
  Trash2, Type, Upload, InboxIcon
} from "lucide-react"
import { toast } from "sonner"

import { itemsApi, projectsApi, remindersApi, requestsApi, templatesApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { handleError } from "@/lib/errors"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ContentRequest, ItemType, PortalData, RequestItem, Template } from "@/types/clientvault"

const ITEM_TYPE_META: Record<ItemType, { label: string; icon: React.ReactNode }> = {
  file_upload: { label: "File Upload", icon: <Upload className="h-3.5 w-3.5" /> },
  short_text: { label: "Short Text", icon: <Type className="h-3.5 w-3.5" /> },
  long_text: { label: "Long Text", icon: <FileText className="h-3.5 w-3.5" /> },
  url: { label: "URL", icon: <Link2 className="h-3.5 w-3.5" /> },
  credentials: { label: "Credentials", icon: <Lock className="h-3.5 w-3.5" /> },
  choice: { label: "Multiple Choice", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const qc = useQueryClient()

  const [tab, setTab] = useState<"structure" | "responses">("structure")
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [addItemOpen, setAddItemOpen] = useState<string | null>(null) // request id
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: queryKeys.clientvault.projects.detail(id),
    queryFn: () => projectsApi.get(id),
  })

  const { data: requests, isLoading: reqLoading } = useQuery({
    queryKey: queryKeys.clientvault.requests.list(id),
    queryFn: () => requestsApi.list(id),
    enabled: !!id,
  })

  const { data: templates } = useQuery({
    queryKey: queryKeys.clientvault.templates.list(),
    queryFn: () => templatesApi.list(),
    enabled: templateDialogOpen,
  })

  const { data: responses, isLoading: responsesLoading } = useQuery({
    queryKey: queryKeys.clientvault.portal.responses(id),
    queryFn: () => projectsApi.getResponses(id),
    enabled: tab === "responses",
  })

  const addSectionMutation = useMutation({
    mutationFn: (data: { title: string; description?: string }) =>
      requestsApi.create(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.requests.list(id) })
      toast.success("Section added")
      setAddSectionOpen(false)
    },
    onError: (err) => handleError(err),
  })

  const deleteSectionMutation = useMutation({
    mutationFn: requestsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.requests.list(id) })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.projects.detail(id) })
      toast.success("Section deleted")
    },
    onError: (err) => handleError(err),
  })

  const addItemMutation = useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: Parameters<typeof itemsApi.create>[1] }) =>
      itemsApi.create(requestId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.requests.list(id) })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.projects.detail(id) })
      toast.success("Item added")
      setAddItemOpen(null)
    },
    onError: (err) => handleError(err),
  })

  const deleteItemMutation = useMutation({
    mutationFn: itemsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.requests.list(id) })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.projects.detail(id) })
      toast.success("Item deleted")
    },
    onError: (err) => handleError(err),
  })

  const reminderMutation = useMutation({
    mutationFn: () => remindersApi.send(id),
    onSuccess: () => toast.success("Reminder sent"),
    onError: (err) => handleError(err),
  })

  const applyTemplateMutation = useMutation({
    mutationFn: (templateId: string) => templatesApi.apply(id, templateId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.requests.list(id) })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.projects.detail(id) })
      toast.success("Template applied")
      setTemplateDialogOpen(false)
    },
    onError: (err) => handleError(err),
  })

  const portalUrl = project?.portal_token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${project.portal_token}`
    : null

  function copyPortalLink() {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl)
      toast.success("Portal link copied")
    }
  }

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (projLoading) return <ProjectSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "icon" })}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white text-sm font-bold"
            style={{ backgroundColor: project?.branding_color ?? "#6366f1" }}
          >
            {project?.client_name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{project?.name}</h1>
            <p className="text-sm text-muted-foreground">{project?.client_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Completion */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-24">
              <Progress value={project?.completion_percent ?? 0} className="h-1.5" />
            </div>
            <span>{project?.submitted_items}/{project?.total_items} items</span>
          </div>

          {/* Portal link */}
          {portalUrl && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={copyPortalLink}>
                <Copy className="h-3.5 w-3.5" />
                Copy portal link
              </Button>
              <Link href={portalUrl} target="_blank" className={buttonVariants({ variant: "outline", size: "icon" }) + " h-8 w-8"}>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Remind */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => reminderMutation.mutate()}
            disabled={reminderMutation.isPending || !project?.client_email}
            title={!project?.client_email ? "Add client email to send reminders" : "Send reminder email"}
          >
            <Bell className="h-3.5 w-3.5" />
            Remind
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setTab("structure")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "structure"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Structure
        </button>
        <button
          onClick={() => setTab("responses")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            tab === "responses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Responses
          {project && project.submitted_items > 0 && (
            <span className="rounded-full bg-primary/10 text-primary text-xs px-1.5 py-0.5 leading-none">
              {project.submitted_items}
            </span>
          )}
        </button>
      </div>

      {/* Responses tab */}
      {tab === "responses" && (
        <ResponsesView data={responses} isLoading={responsesLoading} />
      )}

      {/* Structure tab — Content sections */}
      {tab === "structure" && <div className="space-y-3">
        {reqLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))
        ) : requests?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm font-medium">No content sections yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                Add sections to tell your client what you need — files, copy, credentials, etc.
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button size="sm" onClick={() => setAddSectionOpen(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  Add section
                </Button>
                <Button size="sm" variant="outline" onClick={() => setTemplateDialogOpen(true)}>
                  Use template
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {requests?.map((req) => (
              <SectionCard
                key={req.id}
                req={req}
                expanded={expandedSections.has(req.id)}
                onToggle={() => toggleSection(req.id)}
                onAddItem={() => setAddItemOpen(req.id)}
                onDeleteSection={() => deleteSectionMutation.mutate(req.id)}
                onDeleteItem={(itemId) => deleteItemMutation.mutate(itemId)}
              />
            ))}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setAddSectionOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Add section
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                Apply template
              </Button>
            </div>
          </>
        )}
      </div>}

      {/* Add Section Dialog */}
      <AddSectionDialog
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        onSubmit={(data) => addSectionMutation.mutate(data)}
        loading={addSectionMutation.isPending}
      />

      {/* Add Item Dialog */}
      <AddItemDialog
        open={!!addItemOpen}
        onClose={() => setAddItemOpen(null)}
        onSubmit={(data) => addItemMutation.mutate({ requestId: addItemOpen!, data })}
        loading={addItemMutation.isPending}
      />

      {/* Apply Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {templates?.map((t) => (
              <button
                key={t.id}
                onClick={() => applyTemplateMutation.mutate(t.id)}
                disabled={applyTemplateMutation.isPending}
                className="w-full rounded-lg border p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.sections.length} sections · {t.sections.reduce((acc, s) => acc + s.items.length, 0)} items
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionCard({
  req, expanded, onToggle, onAddItem, onDeleteSection, onDeleteItem
}: {
  req: ContentRequest
  expanded: boolean
  onToggle: () => void
  onAddItem: () => void
  onDeleteSection: () => void
  onDeleteItem: (id: string) => void
}) {
  const submittedCount = req.items.filter(i => false).length // will be tracked via portal data

  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <CardTitle className="text-sm font-semibold">{req.title}</CardTitle>
            <span className="text-xs text-muted-foreground">({req.items.length} items)</span>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onAddItem} className="h-7 text-xs">
              <Plus className="h-3 w-3" />
              Add item
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDeleteSection}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {req.description && (
          <p className="text-xs text-muted-foreground ml-6">{req.description}</p>
        )}
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {req.items.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-muted-foreground">No items yet</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={onAddItem}>
                <Plus className="h-3 w-3" />
                Add first item
              </Button>
            </div>
          ) : (
            <div className="space-y-1">
              {req.items.map((item) => (
                <ItemRow key={item.id} item={item} onDelete={() => onDeleteItem(item.id)} />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function ItemRow({ item, onDelete }: { item: RequestItem; onDelete: () => void }) {
  const meta = ITEM_TYPE_META[item.item_type] ?? ITEM_TYPE_META.short_text

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40 group">
      <span className="text-muted-foreground">{meta.icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm">{item.label}</span>
        {item.is_required && (
          <span className="ml-1.5 text-xs text-destructive">*</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground hidden group-hover:block">{meta.label}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  )
}

function AddSectionDialog({
  open, onClose, onSubmit, loading
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: { title: string; description?: string }) => void
  loading: boolean
}) {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")

  function handleSubmit() {
    if (!title.trim()) return
    onSubmit({ title: title.trim(), description: desc.trim() || undefined })
    setTitle("")
    setDesc("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Content Section</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Section title</Label>
            <Input placeholder="Brand Assets" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description (optional)</Label>
            <Input placeholder="Logo files, colors, and fonts" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || loading}>
            {loading ? "Adding..." : "Add Section"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AddItemDialog({
  open, onClose, onSubmit, loading
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: Parameters<typeof itemsApi.create>[1]) => void
  loading: boolean
}) {
  const [label, setLabel] = useState("")
  const [type, setType] = useState<ItemType>("short_text")
  const [desc, setDesc] = useState("")
  const [required, setRequired] = useState(true)
  const [options, setOptions] = useState("")

  function handleSubmit() {
    if (!label.trim()) return
    onSubmit({
      label: label.trim(),
      item_type: type,
      description: desc.trim() || undefined,
      is_required: required,
      options: type === "choice" && options.trim()
        ? options.split("\n").map((o) => o.trim()).filter(Boolean)
        : undefined,
    })
    setLabel("")
    setType("short_text")
    setDesc("")
    setRequired(true)
    setOptions("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Request Item</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>What do you need?</Label>
            <Input placeholder="Company logo (SVG or PNG)" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ITEM_TYPE_META).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Help text (optional)</Label>
            <Input
              placeholder="Please provide the file in SVG format if possible"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          {type === "choice" && (
            <div className="space-y-1.5">
              <Label>Options (one per line)</Label>
              <Textarea
                placeholder={"Option A\nOption B\nOption C"}
                rows={4}
                value={options}
                onChange={(e) => setOptions(e.target.value)}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="required" className="cursor-pointer font-normal">Required</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!label.trim() || loading}>
            {loading ? "Adding..." : "Add Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResponsesView({ data, isLoading }: { data: PortalData | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}><CardContent className="py-6 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent></Card>
        ))}
      </div>
    )
  }

  if (!data || data.total_items === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <InboxIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium">No items yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add content sections first, then share the portal link with your client.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {data.sections.map((section) => {
        const submitted = section.items.filter((i) => i.submission?.text_value || i.submission?.file_url).length
        return (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{section.title}</CardTitle>
                <span className="text-xs text-muted-foreground">{submitted}/{section.items.length} submitted</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {section.items.map((item) => {
                const sub = item.submission
                const hasValue = sub?.text_value || sub?.file_url
                return (
                  <div key={item.id} className="flex gap-3 rounded-lg border p-3">
                    <div className="mt-0.5 shrink-0">
                      {hasValue
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      }
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.is_required && !hasValue && (
                          <span className="text-xs text-destructive">Required</span>
                        )}
                      </div>
                      {sub?.text_value && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">{sub.text_value}</p>
                      )}
                      {sub?.file_url && (
                        <a
                          href={sub.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {sub.file_name ?? "Download file"}
                          {sub.file_size && (
                            <span className="text-xs text-muted-foreground">({(sub.file_size / 1024).toFixed(1)} KB)</span>
                          )}
                        </a>
                      )}
                      {!hasValue && (
                        <p className="text-xs text-muted-foreground italic">Not submitted yet</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function ProjectSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Card><CardContent className="py-8"><Skeleton className="h-4 w-full" /></CardContent></Card>
    </div>
  )
}
