"use client"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function ProfilePage() {
  const { user } = useAuth()

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U"

  const fields = [
    { label: "User ID", value: user?.id },
    { label: "Email", value: user?.email },
    { label: "Full name", value: user?.full_name || "—" },
    { label: "Status", value: user?.is_active ? "Active" : "Inactive" },
    { label: "Email verified", value: user?.email_verified ? "Yes" : "No" },
  ]

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">Your personal information</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <CardTitle className="text-base">{user?.full_name || "—"}</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
              {user?.email_verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium font-mono text-xs">{value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
