import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="page-title">Page not found</h1>
      <p className="text-sm text-muted">The page you opened doesn't exist or has moved.</p>
      <Link href="/dashboard" className="btn btn-primary mt-4">
        Go to dashboard
      </Link>
    </main>
  );
}
