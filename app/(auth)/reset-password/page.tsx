"use client"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { handleError } from "@/lib/errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const schema = z
  .object({
    new_password: z.string().min(8, "At least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  })
type FormData = z.infer<typeof schema>

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") || ""

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await api.post("/api/auth/reset-password", { token, new_password: data.new_password })
      toast.success("Password reset! Please sign in.")
      router.push("/login")
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>Choose a strong password for your account</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" type="password" {...register("new_password")} />
            {errors.new_password && <p className="text-destructive text-xs">{errors.new_password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...register("confirm")} />
            {errors.confirm && <p className="text-destructive text-xs">{errors.confirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>
}
