import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { AutomationRun } from "@/types";

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: automation } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .single();

  if (!automation) notFound();

  const { data: runs } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("automation_id", id)
    .order("started_at", { ascending: false })
    .limit(20);

  const typedRuns = (runs ?? []) as AutomationRun[];
  const successCount = typedRuns.filter((r) => r.status === "success").length;
  const successRate = typedRuns.length
    ? Math.round((successCount / typedRuns.length) * 100)
    : 0;
  const avgDuration = typedRuns.length
    ? Math.round(
        typedRuns.reduce((sum, r) => sum + (r.duration_ms ?? 0), 0) / typedRuns.length
      )
    : 0;

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/automations" className="text-sm text-muted-foreground hover:text-accent">
            ← Back to automations
          </Link>
          <h1 className="text-2xl font-bold mt-2">{automation.name}</h1>
          <p className="text-muted-foreground">{automation.description}</p>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/automations/new" variant="outline">
            Edit Workflow
          </ButtonLink>
          <form action={`/api/automations/${id}/run`} method="POST">
            <Button className="bg-accent" type="submit">
              Run Now
            </Button>
          </form>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-surface border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-3xl font-bold text-success">{successRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Duration</p>
            <p className="text-3xl font-bold">{avgDuration}ms</p>
          </CardContent>
        </Card>
        <Card className="bg-surface border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-3xl font-bold text-accent">{automation.run_count}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Run History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedRuns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No runs yet
                  </TableCell>
                </TableRow>
              )}
              {typedRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        run.status === "success"
                          ? "text-success"
                          : run.status === "failed"
                          ? "text-danger"
                          : "text-warning"
                      }
                    >
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(run.started_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>{run.duration_ms ? `${run.duration_ms}ms` : "—"}</TableCell>
                  <TableCell className="text-danger text-sm truncate max-w-xs">
                    {run.error_message ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
