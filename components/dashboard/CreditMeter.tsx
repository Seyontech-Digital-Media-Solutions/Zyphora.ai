"use client";

import { cn } from "@/lib/utils";

interface CreditMeterProps {
  remaining: number;
  total?: number;
  plan?: string;
}

export function CreditMeter({ remaining, total = 100, plan = "free" }: CreditMeterProps) {
  const isUnlimited = plan === "agency" || total < 0;
  const percentage = isUnlimited ? 100 : Math.min(100, Math.max(0, (remaining / total) * 100));
  const strokeDasharray = 565.48;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;
  const isLow = !isUnlimited && percentage <= 25;
  const isCritical = !isUnlimited && percentage <= 10;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">AI Credits</p>
          <p className="text-xs text-muted-foreground">Credits usage status</p>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
            isCritical
              ? "border-danger/20 bg-danger/10 text-danger"
              : isLow
                ? "border-warning/20 bg-warning/10 text-warning"
                : "border-accent/20 bg-accent/10 text-accent"
          )}
        >
          {isUnlimited ? "Unlimited" : `${Math.round(percentage)}%`}
        </div>
      </div>

      <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center">
        <svg className="h-full w-full" viewBox="0 0 220 220" aria-hidden="true">
          <circle
            cx="110"
            cy="110"
            r="90"
            strokeWidth="18"
            stroke="rgba(255,255,255,0.08)"
            fill="none"
          />
          <defs>
            <linearGradient id="credit-meter-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6C63FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <circle
            cx="110"
            cy="110"
            r="90"
            strokeWidth="18"
            stroke="url(#credit-meter-gradient)"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 110 110)"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Remaining</p>
          <p className="text-4xl font-semibold text-foreground">
            {isUnlimited ? "∞" : remaining}
          </p>
          <p className="text-sm text-muted-foreground">
            of {isUnlimited ? "Unlimited" : total}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{isUnlimited ? "Agency credits are unlimited." : `${remaining} / ${total} credits left`}</span>
        <span className={cn("font-semibold", isCritical ? "text-danger" : isLow ? "text-warning" : "text-accent")}>
          {isUnlimited ? "Active" : percentage <= 25 ? "Low balance" : "Healthy"}
        </span>
      </div>
    </div>
  );
}
