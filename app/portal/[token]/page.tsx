"use client"
import { use, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  CheckCircle2, ChevronDown, ChevronRight, FileText,
  Link2, Lock, Loader2, Upload, Type
} from "lucide-react"
import { toast } from "sonner"

import { portalApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import type { ItemType, PortalItem, PortalSection, Submission } from "@/types/clientvault"

export default function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const qc = useQueryClient()

  const { data: portal, isLoading, error } = useQuery({
    queryKey: queryKeys.clientvault.portal.get(token),
    queryFn: () => portalApi.get(token),
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: (items: Array<{ request_item_id: string; text_value?: string }>) =>
      portalApi.submit(token, items),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.portal.get(token) })
      toast.success("Saved successfully")
    },
    onError: () => toast.error("Failed to save. Please try again."),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ itemId, file }: { itemId: string; file: File }) =>
      portalApi.uploadFile(token, itemId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.portal.get(token) })
      toast.success("File uploaded")
    },
    onError: () => toast.error("Upload failed. Please try again."),
  })

  const accentColor = portal?.project.branding_color ?? "#6366f1"
  const isComplete = portal ? portal.completion_percent === 100 : false

  if (isLoading) return <PortalSkeleton />

  if (error || !portal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-sm px-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Portal not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be invalid or no longer active. Please contact the person who sent you this link.
          </p>
        </div>
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-sm px-4">
          <div
            className="mx-auto mb-4 h-16 w-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}20` }}
          >
            <CheckCircle2 className="h-8 w-8" style={{ color: accentColor }} />
          </div>
          <h1 className="text-2xl font-bold">All done!</h1>
          <p className="mt-2 text-muted-foreground">
            You've submitted everything requested for <strong>{portal.project.name}</strong>.
            Your team has been notified.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            You can revisit this link anytime to update your submissions.
          </p>
          <Button
            className="mt-6"
            style={{ backgroundColor: accentColor, borderColor: accentColor }}
            onClick={() => qc.invalidateQueries({ queryKey: queryKeys.clientvault.portal.get(token) })}
          >
            Review submissions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Branded header */}
      <div className="border-b bg-background shadow-sm" style={{ borderTopColor: accentColor, borderTopWidth: 4 }}>
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center gap-3">
          {portal.project.branding_logo_url ? (
            <img src={portal.project.branding_logo_url} alt="Logo" className="h-8 w-auto" />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold"
              style={{ backgroundColor: accentColor }}
            >
              {portal.project.client_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold leading-tight">{portal.project.name}</h1>
            <p className="text-xs text-muted-foreground">Content collection</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* Progress */}
        <div className="rounded-xl border bg-background p-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Your progress</span>
            <span className="text-muted-foreground">
              {portal.submitted_items} of {portal.total_items} items completed
            </span>
          </div>
          <Progress value={portal.completion_percent} className="h-2" />
          {portal.project.description && (
            <p className="text-sm text-muted-foreground">{portal.project.description}</p>
          )}
        </div>

        {/* Sections */}
        {portal.sections.map((section) => (
          <PortalSectionCard
            key={section.id}
            section={section}
            accentColor={accentColor}
            onSubmit={(items) => submitMutation.mutate(items)}
            onUpload={(itemId, file) => uploadMutation.mutate({ itemId, file })}
            uploading={uploadMutation.isPending}
          />
        ))}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Your information is kept private and only accessible to the team that sent this link.
        </p>
      </div>
    </div>
  )
}

function PortalSectionCard({
  section, accentColor, onSubmit, onUpload, uploading,
}: {
  section: PortalSection
  accentColor: string
  onSubmit: (items: Array<{ request_item_id: string; text_value?: string }>) => void
  onUpload: (itemId: string, file: File) => void
  uploading: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    section.items.forEach((item) => {
      if (item.submission?.text_value) init[item.id] = item.submission.text_value
    })
    return init
  })

  const completedCount = section.items.filter(
    (i) => i.submission?.text_value || i.submission?.file_url
  ).length

  function handleSaveAll() {
    const items = section.items
      .filter((i) => i.item_type !== "file_upload" && values[i.id] !== undefined)
      .map((i) => ({ request_item_id: i.id, text_value: values[i.id] }))
    if (items.length > 0) onSubmit(items)
  }

  return (
    <div className="rounded-xl border bg-background overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 text-left">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-sm font-semibold">{section.title}</p>
            {section.description && (
              <p className="text-xs text-muted-foreground">{section.description}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground shrink-0">
          {completedCount}/{section.items.length}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t">
          {section.items.map((item) => (
            <PortalItemInput
              key={item.id}
              item={item}
              value={values[item.id] ?? ""}
              onChange={(v) => setValues((prev) => ({ ...prev, [item.id]: v }))}
              onUpload={(file) => onUpload(item.id, file)}
              uploading={uploading}
              accentColor={accentColor}
            />
          ))}

          {section.items.some((i) => i.item_type !== "file_upload") && (
            <Button
              className="w-full"
              onClick={handleSaveAll}
              style={{ backgroundColor: accentColor, borderColor: accentColor }}
            >
              Save section
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function PortalItemInput({
  item, value, onChange, onUpload, uploading, accentColor,
}: {
  item: PortalItem
  value: string
  onChange: (v: string) => void
  onUpload: (file: File) => void
  uploading: boolean
  accentColor: string
}) {
  const isSubmitted = !!(item.submission?.text_value || item.submission?.file_url)

  return (
    <div className="space-y-1.5 pt-4">
      <div className="flex items-center gap-2">
        <ItemTypeIcon type={item.item_type} />
        <label className="text-sm font-medium">
          {item.label}
          {item.is_required && <span className="ml-1 text-destructive">*</span>}
          {isSubmitted && (
            <CheckCircle2 className="inline ml-2 h-3.5 w-3.5 text-green-500" />
          )}
        </label>
      </div>
      {item.description && (
        <p className="text-xs text-muted-foreground">{item.description}</p>
      )}

      {item.item_type === "file_upload" && (
        <FileUploadInput
          item={item}
          onUpload={onUpload}
          uploading={uploading}
          accentColor={accentColor}
        />
      )}

      {item.item_type === "short_text" && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type here..."
        />
      )}

      {item.item_type === "long_text" && (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type here..."
          rows={4}
        />
      )}

      {item.item_type === "url" && (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
        />
      )}

      {item.item_type === "credentials" && (
        <div className="space-y-2">
          <Input
            value={value.split("\n")[0] ?? ""}
            onChange={(e) => {
              const lines = value.split("\n")
              lines[0] = e.target.value
              onChange(lines.join("\n"))
            }}
            placeholder="Username / email"
          />
          <Input
            type="password"
            value={value.split("\n")[1] ?? ""}
            onChange={(e) => {
              const lines = value.split("\n")
              lines[1] = e.target.value
              onChange(lines.join("\n"))
            }}
            placeholder="Password"
          />
        </div>
      )}

      {item.item_type === "choice" && item.options && (
        <div className="space-y-2">
          {item.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={item.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="accent-primary"
              />
              <span className="text-sm">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function FileUploadInput({
  item, onUpload, uploading, accentColor,
}: {
  item: PortalItem
  onUpload: (file: File) => void
  uploading: boolean
  accentColor: string
}) {
  const [dragOver, setDragOver] = useState(false)

  function handleFiles(files: FileList | null) {
    if (files?.[0]) onUpload(files[0])
  }

  if (item.submission?.file_url) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 p-3">
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-green-700 dark:text-green-400 truncate">
            {item.submission.file_name ?? "File uploaded"}
          </p>
          {item.submission.file_size && (
            <p className="text-xs text-green-600/70 dark:text-green-500/70">
              {(item.submission.file_size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
        <label className="cursor-pointer text-xs text-muted-foreground hover:underline">
          Replace
          <input type="file" className="sr-only" onChange={(e) => handleFiles(e.target.files)} />
        </label>
      </div>
    )
  }

  return (
    <label
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
        dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
    >
      {uploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : (
        <>
          <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">Drop file here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
        </>
      )}
      <input type="file" className="sr-only" disabled={uploading} onChange={(e) => handleFiles(e.target.files)} />
    </label>
  )
}

function ItemTypeIcon({ type }: { type: ItemType }) {
  const icons: Record<ItemType, React.ReactNode> = {
    file_upload: <Upload className="h-3.5 w-3.5 text-muted-foreground" />,
    short_text: <Type className="h-3.5 w-3.5 text-muted-foreground" />,
    long_text: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
    url: <Link2 className="h-3.5 w-3.5 text-muted-foreground" />,
    credentials: <Lock className="h-3.5 w-3.5 text-muted-foreground" />,
    choice: <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />,
  }
  return <>{icons[type]}</>
}

function PortalSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="border-b bg-background h-16" />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}
