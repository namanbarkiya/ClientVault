"use client"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { projectsApi } from "@/lib/clientvault-api"
import { queryKeys } from "@/lib/query-keys"
import { handleError } from "@/lib/errors"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z.object({
  name: z.string().min(1, "Project name is required"),
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  description: z.string().optional(),
  branding_color: z.string().regex(/^#[0-9a-fA-F]{3,6}$/, "Must be a valid hex color e.g. #3b82f6").optional().or(z.literal("")),
  due_date: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function NewProjectPage() {
  const router = useRouter()
  const qc = useQueryClient()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      projectsApi.create({
        name: data.name,
        client_name: data.client_name,
        client_email: data.client_email || undefined,
        description: data.description || undefined,
        branding_color: data.branding_color || undefined,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
      }),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ["clientvault", "projects"] })
      qc.invalidateQueries({ queryKey: queryKeys.clientvault.dashboard() })
      toast.success("Project created")
      router.push(`/projects/${project.id}`)
    },
    onError: (err) => handleError(err),
  })

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/projects" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground text-sm">Set up a new client content collection</p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Project name *</Label>
              <Input id="name" placeholder="Acme Corp Website Redesign" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="client_name">Client name *</Label>
                <Input id="client_name" placeholder="Acme Corp" {...register("client_name")} />
                {errors.client_name && <p className="text-xs text-destructive">{errors.client_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="client_email">Client email</Label>
                <Input id="client_email" type="email" placeholder="client@acme.com" {...register("client_email")} />
                {errors.client_email && <p className="text-xs text-destructive">{errors.client_email.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the project..."
                rows={3}
                {...register("description")}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="branding_color">Brand color</Label>
                <Input id="branding_color" placeholder="#6366f1" {...register("branding_color")} />
                {errors.branding_color && <p className="text-xs text-destructive">{errors.branding_color.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" type="date" {...register("due_date")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
            Cancel
          </Link>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Project"}
          </Button>
        </div>
      </form>
    </div>
  )
}
