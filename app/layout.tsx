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
      <body>{children}</body>
    </html>
  );
}
```

---

### **File: `app/page.tsx`**

Use the complete `page.tsx` I provided earlier (the one with the ResumeGod mission control interface).

---

### **Delete these files if they exist:**
- `app/404/layout.tsx` ❌
- `app/404/page.tsx` ❌
- Any other folders inside `app/` except `favicon.ico` or `globals.css` ❌

---

Your `app` folder structure should look like this:
```
app/
├── layout.tsx    ✅
├── page.tsx      ✅
├── globals.css   ✅
└── favicon.ico   ✅ (optional)