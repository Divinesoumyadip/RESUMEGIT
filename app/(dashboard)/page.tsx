import ResumePreview from "@/components/resume-preview";
import { UserButton } from "@clerk/nextjs";
import { syncUser } from "@/lib/db-sync";
import { CreditCard, Zap } from "lucide-react";

export default async function DashboardPage() {
  const user = await syncUser();

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Header */}
      <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span className="font-black italic text-xl tracking-tighter uppercase">
              RESUME<span className="text-amber-500">GOD</span>
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">
                {user?.credits ?? 0} <span className="text-[10px] text-gray-400 uppercase ml-1">Credits</span>
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        <div className="mb-12">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">
            Mission <span className="text-amber-500">Preview</span>
          </h2>
          <p className="text-gray-400 font-medium">Finalize your document specs before deploying the swarm.</p>
        </div>

        {/* This is the component we just created via terminal */}
        <ResumePreview />

        {/* Global Action Bar */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:border-amber-200 transition-all group">
             <h3 className="font-bold text-lg mb-2 group-hover:text-amber-600 transition-colors">Agent Shadow</h3>
             <p className="text-sm text-gray-500">Generate high-conversion referral requests based on this resume.</p>
          </div>
          {/* Add more agent cards here later */}
        </div>
      </main>
    </div>
  );
}
