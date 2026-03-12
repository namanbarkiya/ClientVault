"use client"
import { useCallback, useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, CreditCard, Receipt, Zap } from "lucide-react"
import { toast } from "sonner"

import { billingApi, type Plan, type SubscribeResponse } from "@/lib/billing-api"
import { queryKeys } from "@/lib/query-keys"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

// ---------------------------------------------------------------------------
// Razorpay types
// ---------------------------------------------------------------------------
interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  handler: (response: RazorpayResponse) => void
  prefill?: { email?: string; name?: string }
  theme?: { color?: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void }
  }
}

// ---------------------------------------------------------------------------
// Load Razorpay script once
// ---------------------------------------------------------------------------
let razorpayLoaded = false
function loadRazorpayScript(): Promise<void> {
  if (razorpayLoaded || typeof window !== "undefined" && window.Razorpay) {
    razorpayLoaded = true
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.onload = () => { razorpayLoaded = true; resolve() }
    script.onerror = () => reject(new Error("Failed to load Razorpay"))
    document.head.appendChild(script)
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function BillingPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const [cancelling, setCancelling] = useState(false)
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null)

  // Preload Razorpay script
  useEffect(() => { loadRazorpayScript().catch(() => {}) }, [])

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: queryKeys.billing.plans(),
    queryFn: billingApi.getPlans,
  })

  const { data: sub, isLoading: subLoading } = useQuery({
    queryKey: queryKeys.billing.subscription(),
    queryFn: billingApi.getSubscription,
    retry: false,
  })

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: queryKeys.billing.invoices(),
    queryFn: billingApi.getInvoices,
    retry: false,
  })

  const verifyMutation = useMutation({
    mutationFn: billingApi.verifyPayment,
    onSuccess: () => {
      toast.success("Payment successful — plan activated!")
      qc.invalidateQueries({ queryKey: queryKeys.billing.subscription() })
      qc.invalidateQueries({ queryKey: queryKeys.billing.invoices() })
      setUpgradingPlanId(null)
    },
    onError: () => {
      toast.error("Payment verification failed. Contact support if you were charged.")
      setUpgradingPlanId(null)
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => billingApi.cancel("user_requested"),
    onSuccess: () => {
      toast.success("Subscription cancelled — access continues until period end")
      qc.invalidateQueries({ queryKey: queryKeys.billing.subscription() })
      setCancelling(false)
    },
    onError: () => toast.error("Failed to cancel subscription"),
  })

  const openRazorpay = useCallback(
    (data: SubscribeResponse) => {
      if (!data.requires_payment || !data.razorpay_order_id || !data.razorpay_key) return

      const options: RazorpayOptions = {
        key: data.razorpay_key,
        amount: data.amount!,
        currency: data.currency!,
        name: "ClientVault",
        description: `${data.plan_name} subscription`,
        order_id: data.razorpay_order_id,
        handler: (response) => {
          verifyMutation.mutate({
            subscription_id: data.subscription.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
        },
        prefill: {
          email: user?.email,
          name: user?.full_name || undefined,
        },
        theme: { color: "#18181b" },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled")
            setUpgradingPlanId(null)
            // Refetch to pick up the pending sub if user wants to retry
            qc.invalidateQueries({ queryKey: queryKeys.billing.subscription() })
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    },
    [user, verifyMutation, qc],
  )

  const handleUpgrade = useCallback(
    async (planId: string) => {
      setUpgradingPlanId(planId)
      try {
        await loadRazorpayScript()
        const apiCall = sub ? billingApi.changePlan(planId) : billingApi.subscribe(planId)
        const result = await apiCall

        if (!result.requires_payment) {
          // Free plan — already activated
          toast.success("Plan updated!")
          qc.invalidateQueries({ queryKey: queryKeys.billing.subscription() })
          setUpgradingPlanId(null)
          return
        }

        openRazorpay(result)
      } catch {
        toast.error("Failed to initiate upgrade")
        setUpgradingPlanId(null)
      }
    },
    [sub, openRazorpay, qc],
  )

  const currentPlan = plans?.find((p) => p.id === sub?.plan_id)

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your plan and invoices
        </p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              Current plan
            </CardTitle>
            <CardDescription>
              Your active subscription for ClientVault
            </CardDescription>
          </div>
          {sub && <StatusBadge status={sub.status} />}
        </CardHeader>
        <CardContent>
          {subLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : sub && currentPlan ? (
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold">{currentPlan.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {currentPlan.price_amount === 0
                    ? "Free forever"
                    : `${formatCurrency(currentPlan.price_amount, currentPlan.price_currency)} / ${currentPlan.billing_interval}`}
                </p>
              </div>
              {sub.status === "pending" && (
                <p className="text-sm text-yellow-600">
                  Payment pending — complete checkout to activate this plan.
                </p>
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Current period: {formatDate(sub.current_period_start)} — {formatDate(sub.current_period_end)}
                </p>
                {sub.canceled_at && (
                  <p className="text-orange-600">
                    Cancelled on {formatDate(sub.canceled_at)} — access until {formatDate(sub.current_period_end)}
                  </p>
                )}
              </div>
              {sub.status === "active" && currentPlan.price_amount > 0 && !sub.canceled_at && (
                <div>
                  {cancelling ? (
                    <div className="flex items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        Are you sure? You'll keep access until the period ends.
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                      >
                        Yes, cancel
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setCancelling(false)}>
                        Keep plan
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setCancelling(true)}>
                      Cancel subscription
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription found.</p>
          )}
        </CardContent>
      </Card>

      {/* Available plans */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Available plans
        </h2>
        {plansLoading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {plans
              ?.filter((p) => p.billing_interval !== "one_time")
              .map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrentPlan={plan.id === sub?.plan_id}
                  onSubscribe={handleUpgrade}
                  loading={upgradingPlanId === plan.id}
                />
              ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Invoices */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Receipt className="h-4 w-4 text-muted-foreground" />
          Invoices
        </h2>
        {invoicesLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="rounded-lg border divide-y overflow-hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(inv.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {formatCurrency(inv.total, inv.currency)}
                  </span>
                  <InvoiceBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function PlanCard({
  plan,
  isCurrentPlan,
  onSubscribe,
  loading,
}: {
  plan: Plan
  isCurrentPlan: boolean
  onSubscribe: (id: string) => void
  loading: boolean
}) {
  const featuresObj: Record<string, unknown> =
    typeof plan.features === "string"
      ? JSON.parse(plan.features)
      : (plan.features ?? {})

  const featureList: string[] = Object.keys(featuresObj).length > 0
    ? Object.entries(featuresObj).map(([k, v]) => {
        if (k === "max_projects") return v === -1 ? "Unlimited projects" : `Up to ${v} projects`
        if (k === "priority_support" && v) return "Priority support"
        return `${k}: ${v}`
      }).filter(Boolean) as string[]
    : []

  return (
    <Card className={cn(isCurrentPlan && "border-primary ring-1 ring-primary")}>
      <CardContent className="pt-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold">{plan.name}</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold">
                {plan.price_amount === 0
                  ? "Free"
                  : formatCurrency(plan.price_amount, plan.price_currency)}
              </span>
              {plan.price_amount > 0 && (
                <span className="text-xs text-muted-foreground">/ {plan.billing_interval}</span>
              )}
            </div>
          </div>
          {isCurrentPlan && (
            <Badge variant="secondary" className="text-xs">Current</Badge>
          )}
        </div>

        {plan.description && (
          <p className="text-xs text-muted-foreground">{plan.description}</p>
        )}

        {featureList.length > 0 && (
          <ul className="space-y-1.5">
            {featureList.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {!isCurrentPlan && (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onSubscribe(plan.id)}
            disabled={loading}
          >
            {loading ? "Processing..." : plan.price_amount === 0 ? "Switch to Free" : "Upgrade"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    past_due: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    canceled: "bg-muted text-muted-foreground",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        map[status] ?? map.canceled,
      )}
    >
      {status.replace("_", " ")}
    </span>
  )
}

function InvoiceBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        status === "paid" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  )
}

function formatCurrency(amount: number, currency = "INR") {
  const value = amount / 100
  if (currency === "INR") return `\u20B9${value.toLocaleString("en-IN")}`
  return `${currency} ${value}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
