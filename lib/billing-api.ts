import { api } from "@/lib/api"

const BASE = "/api/billing"

export interface Plan {
  id: string
  product: string
  name: string
  slug: string
  description: string | null
  price_amount: number
  price_currency: string
  billing_interval: string
  trial_days: number
  is_active: boolean
  sort_order: number
  credits_included: number
  features: Record<string, unknown> | null
  created_at: string
}

export interface Subscription {
  id: string
  customer_id: string
  plan_id: string
  product: string
  status: string
  current_period_start: string
  current_period_end: string
  trial_end: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscribeResponse {
  subscription: Subscription
  requires_payment: boolean
  razorpay_order_id?: string
  razorpay_key?: string
  amount?: number
  currency?: string
  plan_name?: string
}

export interface Invoice {
  id: string
  invoice_number: string
  status: string
  subtotal: number
  tax: number
  total: number
  currency: string
  created_at: string
}

export const billingApi = {
  getPlans: () =>
    api.get<Plan[]>(`${BASE}/plans`).then((r) => r.data),

  getSubscription: () =>
    api.get<Subscription>(`${BASE}/subscription`).then((r) => r.data),

  subscribe: (planId: string) =>
    api.post<SubscribeResponse>(`${BASE}/subscribe`, { plan_id: planId }).then((r) => r.data),

  changePlan: (newPlanId: string) =>
    api.post<SubscribeResponse>(`${BASE}/change-plan`, { new_plan_id: newPlanId }).then((r) => r.data),

  verifyPayment: (data: {
    subscription_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
  }) =>
    api.post<Subscription>(`${BASE}/verify-payment`, data).then((r) => r.data),

  cancel: (reason?: string) =>
    api.post<Subscription>(`${BASE}/cancel`, { reason }).then((r) => r.data),

  getInvoices: () =>
    api.get<Invoice[]>(`${BASE}/invoices`).then((r) => r.data),
}
