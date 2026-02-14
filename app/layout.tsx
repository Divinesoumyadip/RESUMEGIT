import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ResumeGod - AI Resume Optimization",
  description: "Optimize your resume with AI-powered swarm intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}