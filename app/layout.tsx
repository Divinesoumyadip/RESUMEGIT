import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeGod - AI Resume Optimization",
  description: "Optimize your resume with AI-powered swarm intelligence",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-black text-white antialiased">
          {/* Navigation Bar */}
          <nav className="flex justify-between items-center p-6 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <h1 className="text-xl font-black tracking-tighter text-amber-500 italic">RESUMEGOD</h1>
            
            <div className="flex items-center gap-4">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-5 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-amber-500 transition-all duration-300">
                    ACCESS SYSTEM
                  </button>
                </SignInButton>
              </SignedOut>
              
              <SignedIn>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-mono hidden md:block">OPERATOR ACTIVE</span>
                  <UserButton afterSignOutUrl="/" />
                </div>
              </SignedIn>
            </div>
          </nav>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}