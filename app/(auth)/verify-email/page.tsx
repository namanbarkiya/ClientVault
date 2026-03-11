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

const schema = z.object({ otp: z.string().length(6, "Must be 6 digits") })
type FormData = z.infer<typeof schema>

function VerifyEmailForm() {
  const router = useRouter()
  const params = useSearchParams()
  const email = params.get("email") || ""

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    try {
      await api.post("/api/auth/verify-email", { email, otp: data.otp })
      toast.success("Email verified! Please sign in.")
      router.push("/login")
    } catch (err) {
      handleError(err)
    }
  }

  async function resend() {
    try {
      await api.post("/api/auth/resend-otp", { email })
      toast.success("New code sent!")
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to <strong>{email || "your email"}</strong>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp">Verification code</Label>
            <Input id="otp" placeholder="123456" maxLength={6} className="tracking-widest text-center text-lg" {...register("otp")} />
            {errors.otp && <p className="text-destructive text-xs">{errors.otp.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Verify email"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={resend}>
            Resend code
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailForm /></Suspense>
}
