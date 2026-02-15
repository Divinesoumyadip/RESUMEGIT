export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="p-20 flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="border-8 border-black p-10 rounded-[50px] shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-8xl font-black italic uppercase tracking-tighter text-blue-600">
          MISSION <span className="text-black">LIVE</span>
        </h1>
        <p className="mt-4 font-mono font-bold text-gray-400">STATUS: HANDSHAKE_SUCCESS // OPERATOR: SDE-2026-JIS</p>
      </div>
    </div>
  );
}
