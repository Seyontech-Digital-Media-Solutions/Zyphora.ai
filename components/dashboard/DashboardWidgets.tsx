"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    ArrowDownRight,
    ArrowUpRight,
    Bell,
    ChevronDown,
    PenLine,
    Search,
    Sparkles,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuPortal,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditMeter } from "@/components/dashboard/CreditMeter";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
    draft: "bg-yellow-500/15 text-warning border-warning/20",
    scheduled: "bg-sky-500/15 text-sky-300 border-sky-200/30",
    published: "bg-emerald-500/15 text-success border-success/20",
};

function buildSparklinePath(values: number[]) {
    const max = Math.max(...values, 1);
    const step = 100 / (values.length - 1);
    return values
        .map((value, index) => {
            const x = index * step;
            const y = 100 - (value / max) * 80 - 10;
            return `${index === 0 ? "M" : "L"}${x},${y}`;
        })
        .join(" ");
}

function AnimatedNumber({ value }: { value: number }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        const duration = 700;

        const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setDisplayValue(Math.floor(progress * value));
            if (progress < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [value]);

    return <>{displayValue.toLocaleString()}</>;
}

function LazySection({ children, skeleton }: { children: React.ReactNode; skeleton: React.ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: "120px" }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className="animation-fade-in-up">
            {visible ? children : skeleton}
        </div>
    );
}

function VirtualizedList<T>({
    items,
    renderItem,
    estimatedItemHeight,
}: {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    estimatedItemHeight: number;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 4;
    const totalHeight = items.length * estimatedItemHeight;
    const visibleItems = items.slice(startIndex, startIndex + visibleCount);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onScroll = () => {
            const index = Math.floor(container.scrollTop / estimatedItemHeight);
            setStartIndex(Math.max(0, Math.min(items.length - visibleCount, index)));
        };

        container.addEventListener("scroll", onScroll);
        return () => container.removeEventListener("scroll", onScroll);
    }, [items.length, estimatedItemHeight]);

    return (
        <div ref={containerRef} className="max-h-[360px] overflow-y-auto pr-2">
            <div style={{ height: totalHeight }} className="relative">
                <div style={{ transform: `translateY(${startIndex * estimatedItemHeight}px)` }}>
                    {visibleItems.map(renderItem)}
                </div>
            </div>
        </div>
    );
}

interface ContentItem {
    id: string;
    title: string;
    body: string;
    platform: string;
    status: string;
    published_at?: string;
    scheduled_at?: string;
    hashtags?: string[];
    media_url?: string | null;
    analytics?: Record<string, number | undefined>;
}

interface Automation {
    id: string;
    name: string;
    trigger_type: string;
    is_active: boolean;
    run_count: number;
    last_run_at: string;
    status: string;
}

interface ActivityItem {
    id: string;
    type: string;
    message: string;
    timestamp: string;
}

export function DashboardWidgets({
    profile,
    stats,
    contentItems,
    automations,
    activity,
    mockPlan,
    greeting,
}: {
    profile: { full_name?: string; plan?: string };
    stats: {
        totalFollowers: number;
        followersGrowth: number;
        postsPublished: number;
        avgEngagement: string;
        automationsRun: number;
        creditsUsed: number;
    };
    contentItems: ContentItem[];
    automations: Automation[];
    activity: ActivityItem[];
    mockPlan: { creditsRemaining: number; total: number; plan: string };
    greeting: string;
}) {
    const firstName = profile?.full_name?.split(" ")[0] ?? "there";
    const statsData = useMemo(
        () => [
            {
                label: "Total Followers",
                value: stats.totalFollowers,
                subtitle: `+${stats.followersGrowth} this week`,
                icon: Users,
                trend: stats.followersGrowth,
                sparkline: [18, 22, 26, 24, 28, 34, 40],
                accent: "from-[#6C63FF]/30 to-[#4F46E5]/20",
            },
            {
                label: "Posts Published",
                value: stats.postsPublished,
                subtitle: "this month",
                icon: PenLine,
                trend: 8,
                sparkline: [5, 7, 8, 6, 8, 10, 12],
                accent: "from-[#A78BFA]/30 to-[#818CF8]/20",
            },
            {
                label: "Automations Run",
                value: stats.automationsRun,
                subtitle: "total",
                icon: Zap,
                trend: 12,
                sparkline: [12, 14, 18, 16, 20, 22, 24],
                accent: "from-[#4F46E5]/30 to-[#6D28D9]/20",
            },
            {
                label: "Avg Engagement",
                value: stats.avgEngagement,
                subtitle: "across platforms",
                icon: TrendingUp,
                trend: 1.1,
                sparkline: [2.8, 3.0, 3.4, 3.9, 4.1, 4.2, 4.2],
                accent: "from-[#7C3AED]/30 to-[#8B5CF6]/20",
            },
        ],
        [stats]
    );

    const pipelineGroups = useMemo(
        () => [
            {
                status: "draft",
                label: "Draft",
                color: statusStyles.draft,
                items: contentItems.filter((item) => item.status === "draft"),
            },
            {
                status: "scheduled",
                label: "Scheduled",
                color: statusStyles.scheduled,
                items: contentItems.filter((item) => item.status === "scheduled"),
            },
            {
                status: "published",
                label: "Published",
                color: statusStyles.published,
                items: contentItems.filter((item) => item.status === "published"),
            },
        ],
        [contentItems]
    );

    const userActions = [
        { label: "Profile", href: "/settings", icon: Sparkles },
        { label: "Settings", href: "/settings", icon: PenLine },
        { label: "Sign out", href: "/logout", icon: Zap },
    ];

    return (
        <div className="space-y-8">
            <div className="rounded-[28px] border border-white/10 bg-surface/70 p-6 shadow-glow backdrop-blur-xl">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                            Dashboard
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="space-y-1">
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                    {greeting}, {firstName}
                                </h1>
                                <p className="max-w-2xl text-sm text-muted-foreground">
                                    Track content performance, credits, and AI workflows from one beautiful control center.
                                </p>
                            </div>
                            <Badge className="rounded-full bg-[#6C63FF]/15 text-[#E9D5FF] border border-white/10 px-3 py-1 text-xs font-semibold">
                                {mockPlan.plan?.toUpperCase()} PLAN
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="group relative flex w-full max-w-md items-center rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-foreground transition-all duration-200 focus-within:border-accent/40 focus-within:ring-1 focus-within:ring-accent/20">
                            <Search className="mr-3 h-4 w-4 text-muted-foreground transition-transform duration-200 group-focus-within:-translate-x-1" />
                            <Input
                                type="search"
                                placeholder="Search content, automations, insights..."
                                className="bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                                aria-label="Search dashboard"
                            />
                        </label>
                        <div className="flex items-center gap-3">
                            <button className="relative inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-foreground transition duration-200 hover:border-accent/30 hover:bg-white/10">
                                <Bell className="h-5 w-5" />
                                <span className="absolute -right-1 -top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#6C63FF] text-[10px] font-semibold text-white">
                                    3
                                </span>
                            </button>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="inline-flex h-12 items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground transition hover:border-accent/30 hover:bg-white/10">
                                    <Avatar className="h-10 w-10 border border-white/10 bg-[#15181F]/90 text-xs text-foreground">
                                        <AvatarFallback>{firstName?.[0] ?? "Z"}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 text-left">
                                        <p className="text-sm font-medium text-foreground">{firstName}</p>
                                        <p className="text-xs text-muted-foreground">View account</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuPortal>
                                    <DropdownMenuContent className="rounded-3xl border border-white/10 bg-[#090B1D]/95 p-2 shadow-glow">
                                        <DropdownMenuLabel>Account</DropdownMenuLabel>
                                        <DropdownMenuGroup>
                                            {userActions.map((action) => (
                                                <DropdownMenuItem key={action.label} render={<Link href={action.href} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-foreground transition hover:bg-white/5" />}>
                                                    <action.icon className="h-4 w-4 text-accent" />
                                                    {action.label}
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenuPortal>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            <LazySection
                skeleton={
                    <div className="grid gap-6 lg:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="h-40 rounded-[28px] bg-white/5 p-6 shadow-sm animate-pulse" />
                        ))}
                    </div>
                }
            >
                <div className="grid gap-6 xl:grid-cols-4">
                    {statsData.map((stat) => {
                        const Icon = stat.icon;
                        const trendPositive = stat.trend >= 0;
                        return (
                            <Card
                                key={stat.label}
                                className="glass-card group transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow"
                            >
                                <CardContent className="space-y-4 p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                                            <p className="mt-3 text-3xl font-semibold text-foreground">
                                                {typeof stat.value === "number" ? <AnimatedNumber value={stat.value} /> : stat.value}
                                            </p>
                                        </div>
                                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-3xl", stat.accent)}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <span className={cn("inline-flex items-center gap-1 font-semibold", trendPositive ? "text-success" : "text-danger")}>
                                                {trendPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                                {stat.subtitle}
                                            </span>
                                        </div>
                                        <Badge className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground border border-white/10">
                                            {trendPositive ? "Up" : "Down"}
                                        </Badge>
                                    </div>
                                    <div className="overflow-hidden rounded-3xl bg-white/5 p-3">
                                        <svg viewBox="0 0 100 100" className="h-16 w-full">
                                            <defs>
                                                <linearGradient id={`sparkline-${stat.label.replace(/\s+/g, "-")}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.9" />
                                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.3" />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d={buildSparklinePath(stat.sparkline)}
                                                fill="none"
                                                stroke={`url(#sparkline-${stat.label.replace(/\s+/g, "-")})`}
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </LazySection>

            <div className="grid gap-6 xl:grid-cols-[1.96fr_1fr]">
                <LazySection
                    skeleton={
                        <div className="grid gap-6">
                            <div className="h-96 rounded-[28px] bg-white/5 animate-pulse" />
                        </div>
                    }
                >
                    <Card className="glass-card p-6 shadow-glow">
                        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground">Content Pipeline</CardTitle>
                                <p className="text-sm text-muted-foreground">A Kanban view of your draft, scheduled, and published posts.</p>
                            </div>
                            <Link
                                href="/content"
                                className="text-sm font-medium text-accent transition hover:text-secondary"
                            >
                                View all content
                            </Link>
                        </CardHeader>

                        <div className="mt-6 grid gap-4 xl:grid-cols-3">
                            {pipelineGroups.map((group) => (
                                <div key={group.status} className="flex flex-col rounded-[28px] border border-white/10 bg-white/5 p-4">
                                    <div className="flex items-center justify-between gap-2 pb-4">
                                        <div>
                                            <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">{group.label}</h3>
                                            <p className="mt-2 text-3xl font-semibold text-foreground">{group.items.length}</p>
                                        </div>
                                        <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", group.color)}>
                                            {group.label}
                                        </span>
                                    </div>
                                    <div className="rounded-[24px] border border-white/10 bg-[#0C0C1C]/80 p-2">
                                        <VirtualizedList
                                            items={group.items}
                                            estimatedItemHeight={94}
                                            renderItem={(item) => (
                                                <Link
                                                    key={item.id}
                                                    href={`/content/${item.id}`}
                                                    className="mb-3 flex items-start justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/10"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                                                        <p className="mt-2 text-xs text-muted-foreground">{item.platform} · {new Date(item.published_at ?? item.scheduled_at ?? Date.now()).toLocaleDateString()}</p>
                                                    </div>
                                                    <Badge className={cn("rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", statusStyles[item.status])}>
                                                        {item.status}
                                                    </Badge>
                                                </Link>
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </LazySection>

                <div className="space-y-6">
                    <LazySection
                        skeleton={
                            <div className="h-56 rounded-[28px] bg-white/5 animate-pulse" />
                        }
                    >
                        <Card className="glass-card p-6 shadow-glow">
                            <CardHeader>
                                <CardTitle className="text-lg text-foreground">AI Credits</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-6 py-4">
                                <CreditMeter remaining={mockPlan.creditsRemaining} total={mockPlan.total} plan={mockPlan.plan} />
                                <div className="text-center text-sm text-muted-foreground">
                                    Your AI credits balance updates in real time across all content campaigns.
                                </div>
                            </CardContent>
                        </Card>
                    </LazySection>

                    <LazySection
                        skeleton={
                            <div className="h-72 rounded-[28px] bg-white/5 animate-pulse" />
                        }
                    >
                        <Card className="glass-card p-6 shadow-glow">
                            <CardHeader className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-lg text-foreground">Active Automations</CardTitle>
                                    <p className="text-sm text-muted-foreground">Live workflows keeping your business moving.</p>
                                </div>
                                <Link href="/automations" className="text-sm font-medium text-accent transition hover:text-secondary">
                                    Manage
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3 py-4">
                                {automations.map((automation) => (
                                    <div key={automation.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:border-accent/20 hover:bg-white/10">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-3xl bg-[#6C63FF]/15 text-[#C4B5FD]">
                                                    <Zap className="h-5 w-5" />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-foreground">{automation.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {automation.last_run_at
                                                            ? `Last run ${new Date(automation.last_run_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                                                            : "Not run yet"}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="rounded-full bg-emerald-500/10 text-success px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                                                Active
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </LazySection>
                </div>
            </div>

            <LazySection
                skeleton={
                    <div className="h-72 rounded-[28px] bg-white/5 animate-pulse" />
                }
            >
                <Card className="glass-card p-6 shadow-glow">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
                            <p className="text-sm text-muted-foreground">Latest updates across your content and workflows.</p>
                        </div>
                        <Button variant="secondary" className="rounded-full px-4 py-2 text-sm">
                            View all updates
                        </Button>
                    </CardHeader>
                    <CardContent className="mt-6 space-y-4">
                        {activity.map((item) => (
                            <div key={item.id} className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">{item.message}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p>
                                </div>
                                <Badge className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground border border-white/10">
                                    {item.type ?? "Update"}
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </LazySection>
        </div>
    );
}
