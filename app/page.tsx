"use client"
import Link from "next/link"
import { CheckCircle2, FolderOpen, Link2, Upload } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

const features = [
  {
    icon: FolderOpen,
    title: "Organised projects",
    description: "Create a project per client. Group content requests into sections so nothing gets lost.",
  },
  {
    icon: Link2,
    title: "Shareable portal link",
    description: "Send clients a unique link — no login required. They fill in the form at their own pace.",
  },
  {
    icon: Upload,
    title: "File & text collection",
    description: "Collect logos, copy, images, and any structured text in one place, not scattered across emails.",
  },
  {
    icon: CheckCircle2,
    title: "Track completion",
    description: "See exactly which items are pending, submitted, or approved at a glance.",
  },
]

const plans = [
  {
    name: "Free",
    price: "₹0",
    interval: "forever",
    description: "Perfect for freelancers just getting started.",
    features: ["Up to 3 projects", "Shareable portal link", "File & text collection", "Completion tracking"],
    cta: "Get started free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Pro",
    price: "₹499",
    interval: "/ month",
    description: "For agencies running multiple client projects.",
    features: [
      "Unlimited projects",
      "Shareable portal link",
      "File & text collection",
      "Completion tracking",
      "Priority support",
      "14-day free trial",
    ],
    cta: "Start free trial",
    href: "/register",
    highlight: true,
  },
]

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              CV
            </div>
            <span className="font-semibold text-base">ClientVault</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {!isLoading && (
              isAuthenticated ? (
                <Link href="/dashboard" className={cn(buttonVariants({ size: "sm" }))}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                    Sign in
                  </Link>
                  <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
                    Get started
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground bg-muted/50">
              ✦ Client content collection, simplified
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
              Stop chasing clients<br />for content
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              ClientVault gives every client a branded portal to submit text, files, and assets —
              tracked in one place so your projects move forward.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isLoading && (
                isAuthenticated ? (
                  <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }))}>
                    Go to dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>
                      Get started free
                    </Link>
                    <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                      Sign in
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-20 px-6 border-t bg-muted/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                A simple, focused tool for freelancers and agencies who bill by deliverable.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-xl border bg-background p-6 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 px-6 border-t">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
              <p className="text-muted-foreground">Three steps from setup to submitted content.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {[
                { step: "1", title: "Create a project", body: "Add your client's name and set up the content sections you need — logos, copy, photos, anything." },
                { step: "2", title: "Share the link", body: "ClientVault generates a unique portal URL. Paste it in an email or message — no login required for the client." },
                { step: "3", title: "Watch it fill up", body: "Track each item's status in real time. Download files or copy text directly from your dashboard." },
              ].map(({ step, title, body }) => (
                <div key={step} className="space-y-3 text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                    {step}
                  </div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 px-6 border-t bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14 space-y-3">
              <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
              <p className="text-muted-foreground">Start free. Upgrade when you need more.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-xl border bg-background p-6 space-y-5 flex flex-col",
                    plan.highlight && "border-primary ring-1 ring-primary"
                  )}
                >
                  {plan.highlight && (
                    <span className="self-start inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      Most popular
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">{plan.name}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.interval}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={isAuthenticated ? "/billing" : plan.href}
                    className={cn(
                      buttonVariants({ variant: plan.highlight ? "default" : "outline" }),
                      "w-full text-center"
                    )}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-bold text-xs">
              CV
            </div>
            <span>ClientVault</span>
          </div>
          <p>© {new Date().getFullYear()} ClientVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
