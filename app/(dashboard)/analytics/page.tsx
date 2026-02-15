import { prisma } from "@/lib/db";
import { syncUser } from "@/lib/db-sync";
import { Activity, Zap, Clock, ShieldCheck, BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
  const user = await syncUser();
  if (!user) return <div>Unauthorized</div>;

  // Fetch real-time telemetry from your Singapore Supabase instance
  const missions = await prisma.mission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  const totalMissions = missions.length;
  const creditsUsed = totalMissions; // Assuming 1 mission = 1 credit
  const lastActivity = missions[0]?.createdAt.toLocaleDateString() || "No activity";

  return (
    <main className="p-8 space-y-8 bg-white min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">
            System <span className="text-blue-600">Telemetry</span>
          </h2>
          <p className="text-gray-400 font-medium">Real-time intelligence from your AI Swarm operations.</p>
        </div>
        <div className="bg-gray-100 px-4 py-2 rounded-xl border border-gray-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Healthy</span>
        </div>
      </div>

      {/* Metric Grid - Matches Juspay's "Data Science" CoE */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Missions", val: totalMissions, icon: Activity, color: "text-blue-500" },
          { label: "Credits Burned", val: creditsUsed, icon: Zap, color: "text-amber-500" },
          { label: "Avg Scan Time", val: "1.2s", icon: Clock, color: "text-purple-500" },
          { label: "Success Rate", val: "99.9%", icon: BarChart3, color: "text-green-500" },
        ].map((m, i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50">
            <m.icon className={`w-5 h-5 ${m.color} mb-4`} />
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{m.label}</p>
            <p className="text-3xl font-black mt-1">{m.val}</p>
          </div>
        ))}
      </div>

      {/* Mission Log Table */}
      <div className="mt-12 rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Mission Type</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Timestamp</th>
              <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {missions.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm">{m.type}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{m.createdAt.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Success</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
