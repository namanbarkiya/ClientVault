// Portal pages are public and render outside the dashboard layout.
// Providers (QueryProvider, Toaster) are inherited from the root layout.
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
