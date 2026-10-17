export default function OfflinePage() {
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="text-5xl">📶</div>
      <h1 className="text-xl font-bold">You are offline</h1>
      <p className="text-sm text-slate-500 max-w-xs">
        Your changes will be saved and synced when you reconnect. Approvals you
        made offline will be submitted automatically.
      </p>
    </main>
  );
}
