export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold tracking-tight">CalendarCal</h1>
      <p className="max-w-xl text-muted-foreground">
        This starter includes magic-link authentication powered by Prisma, SendGrid, and iron-session. Use the login page to
        request a sign-in link and head to your dashboard.
      </p>
      <div className="flex gap-3">
        <a
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          href="/login"
        >
          Go to login
        </a>
        <a
          className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          href="/dashboard"
        >
          Dashboard
        </a>
      </div>
    </main>
  );
}
