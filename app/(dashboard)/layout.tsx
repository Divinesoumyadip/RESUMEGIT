import Sidebar from "@/components/sidebar";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Side-mounted Navigation */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Clerk Auth */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-end px-8 gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
           <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase text-gray-300 tracking-[0.2em]">Secure Node</span>
             <UserButton afterSignOutUrl="/" />
           </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
