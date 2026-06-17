"use client";

import { useEffect, useState } from "react";
import { registerToastHandler } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [type, setType] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    registerToastHandler((msg, t = "info") => {
      setMessage(msg);
      setType(t);
      setTimeout(() => setMessage(null), 3000);
    });
  }, []);

  return (
    <>
      {children}
      {message && (
        <div
          className={cn(
            "fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100]",
            "px-4 py-3 rounded-lg shadow-lg text-sm font-medium",
            "bg-surface border border-border text-foreground",
            type === "success" && "border-success/50",
            type === "error" && "border-danger/50"
          )}
        >
          {message}
        </div>
      )}
    </>
  );
}
