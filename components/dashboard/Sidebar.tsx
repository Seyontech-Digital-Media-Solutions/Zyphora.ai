"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Home,
  Inbox,
  Layers,
  PenLine,
  Plug,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/inbox", label: "AI Assistant", icon: Sparkles },
  { href: "/content", label: "Content", icon: PenLine },
  { href: "/automations", label: "Automations", icon: Zap },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  plan?: string;
  className?: string;
}

export function Sidebar({ plan = "free", className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex min-h-screen w-[260px] max-w-[260px] flex-col border-r border-white/10 bg-[#080A17]/90 px-3 py-5 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 shadow-sm shadow-[#0E0F23]/60">
        <Layers className="h-7 w-7 text-[#A78BFA]" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Zyphora</p>
          <p className="text-xs text-muted-foreground">AI business command center</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2 px-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#6C63FF]/10 text-foreground shadow-[0_10px_30px_rgba(108,99,255,0.14)]"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                "before:absolute before:left-0 before:top-1/2 before:h-10 before:w-1 before:-translate-y-1/2 before:rounded-r-full",
                isActive ? "before:bg-accent" : "before:bg-transparent"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-accent" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {plan === "free" && (
        <div className="mt-auto rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground shadow-sm shadow-[#0E0F23]/40">
          <Badge className="bg-[#6C63FF] text-white mb-2">Upgrade</Badge>
          <p className="mb-3 text-xs text-muted-foreground">
            Unlock unlimited AI credits, workflows, and premium analytics.
          </p>
          <Link
            href="/settings?tab=billing"
            className="inline-flex rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-accent transition hover:bg-white/10"
          >
            View plans →
          </Link>
        </div>
      )}
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const mobileItems = navItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-surface md:hidden">
      {mobileItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs",
              isActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
