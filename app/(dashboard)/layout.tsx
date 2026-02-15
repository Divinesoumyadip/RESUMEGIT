import Sidebar from "@/components/sidebar";
import { UserButton } from "@clerk/nextjs";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* 1. The Global Sidebar we created via terminal */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Top Bar for Auth & Quick Actions */}
        <header className="h-16 border-b border-gray-100 flex items-center justify-end px-8 gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
           <UserButton afterSignOutUrl="/" />
        </header>

        {/* 3. Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}