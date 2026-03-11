export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Niya</h1>
          <p className="text-sm text-muted-foreground mt-1">Your product, your way.</p>
        </div>
        {children}
      </div>
    </div>
  )
}
