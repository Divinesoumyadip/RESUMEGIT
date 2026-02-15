export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-7xl font-black uppercase tracking-tighter italic leading-none">
          Mission <span className="text-blue-600">Control</span>
        </h1>
        <p className="text-gray-400 font-bold uppercase text-xs tracking-[0.4em]">
          Operator: SDE-2026-JIS // Region: Singapore-East
        </p>
      </div>

      <div className="p-12 border-4 border-black rounded-[40px] bg-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        <h2 className="text-2xl font-black uppercase mb-4">Systems Active</h2>
        <p className="text-gray-500 font-medium">Authentication verified. Handshake with Supabase established.</p>
      </div>
    </div>
  );
}
