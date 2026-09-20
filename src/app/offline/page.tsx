export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <svg
          className="h-7 w-7 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1v22h22" />
          <path d="M16.5 8.5a5 5 0 0 1 4 4.9" />
          <path d="M18 18a5 5 0 0 1-5 5" />
          <path d="M5 16a4.5 4.5 0 0 1 .5-9" />
        </svg>
      </div>
      <h1 className="font-serif text-xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Finance Tracker needs a connection to load your latest data. Check your
        network and try again.
      </p>
    </div>
  );
}
