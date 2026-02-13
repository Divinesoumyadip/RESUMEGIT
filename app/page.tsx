"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch((err) => console.error("Backend error:", err));
  }, []);

  return (
    <main
      style={{
        background: "black",
        color: "white",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
        ResumeGod Live
      </h1>

      <p style={{ color: "#888" }}>2026-2040 Startup Vision Initiated</p>

      <br />

      {health ? (
        <p style={{ color: "#22c55e" }}>
          Backend Connected ✅ ({health.status}) | Version {health.version}
        </p>
      ) : (
        <p style={{ color: "#f59e0b" }}>Connecting backend...</p>
      )}
    </main>
  );
}
