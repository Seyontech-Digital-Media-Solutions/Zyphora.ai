"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { MOCK_ANALYTICS } from "@/lib/mock/data";

const COLORS = ["#6C63FF", "#8B85FF", "#10B981", "#F59E0B"];

const overview = [
  { platform: "Twitter", followers: "3.2K", engagement: "4.2%", reach: "12.4K" },
  { platform: "LinkedIn", followers: "2.1K", engagement: "6.8%", reach: "8.2K" },
  { platform: "Instagram", followers: "4.5K", engagement: "5.1%", reach: "18.6K" },
];

export default function AnalyticsPage() {
  const exportCSV = () => {
    const csv = overview.map((o) => Object.values(o).join(",")).join("\n");
    const blob = new Blob([`Platform,Followers,Engagement,Reach\n${csv}`], {
      type: "text/csv",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zyphora-analytics.csv";
    a.click();
  };

  const topContent = MOCK_ANALYTICS.topPosts.map((p) => ({
    name: p.title,
    engagement: p.likes + p.shares,
  }));

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Track your social growth and performance.
          </p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {overview.map((o) => (
          <Card key={o.platform} className="bg-surface border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {o.platform}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold">{o.followers}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-success">{o.engagement}</p>
                  <p className="text-xs text-muted-foreground">Engagement</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-accent">{o.reach}</p>
                  <p className="text-xs text-muted-foreground">Reach</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg">Follower Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_ANALYTICS.followerGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1F2937" }}
                />
                <Line type="monotone" dataKey="twitter" stroke="#38BDF8" strokeWidth={2} />
                <Line type="monotone" dataKey="linkedin" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="instagram" stroke="#EC4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg">Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topContent} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis type="number" stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1F2937" }}
                />
                <Bar dataKey="engagement" fill="#6C63FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg">Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={MOCK_ANALYTICS.platformBreakdown}
                  dataKey="percentage"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {MOCK_ANALYTICS.platformBreakdown.map((entry, i) => (
                    <Cell key={entry.platform} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #1F2937" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-lg">Best Time to Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, dayIdx) =>
                Array.from({ length: 24 }, (_, hour) => {
                  const intensity =
                    (dayIdx * 3 + hour) % 10 > 6 ? 0.7 : (dayIdx * 2 + hour) % 10 > 4 ? 0.4 : 0.15;
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className="aspect-square rounded-sm"
                      style={{ background: `rgba(108, 99, 255, ${intensity})` }}
                      title={`${day} ${hour}:00`}
                    />
                  );
                })
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Darker = higher engagement
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
