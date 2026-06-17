import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileNav } from "@/components/dashboard/Sidebar";
import { AIChatBubble } from "@/components/shared/AIChatBubble";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, onboarded")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-background">
      <Sidebar plan={profile?.plan ?? "free"} className="hidden md:flex" />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <MobileNav />
      <AIChatBubble />
    </div>
  );
}
