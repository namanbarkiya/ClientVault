"use client"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"

export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-xl tracking-tight">Niya</span>
          <div className="flex gap-2">
            {!isLoading && (
              isAuthenticated ? (
                <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }))}>
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
                    Sign in
                  </Link>
                  <Link href="/register" className={cn(buttonVariants({ variant: "default" }))}>
                    Get started
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-8">
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Your product,<br />your way.
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            A multi-product SaaS starter with a shared FastAPI backend and per-product Next.js frontends.
          </p>
        </div>
        <div className="flex gap-3">
          {!isLoading && (
            isAuthenticated ? (
              <Link href="/dashboard" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className={cn(buttonVariants({ variant: "default", size: "lg" }))}>
                  Get started free
                </Link>
                <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Sign in
                </Link>
              </>
            )
          )}
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        Built with Next.js 16 + FastAPI
      </footer>
    </div>
  )
}
