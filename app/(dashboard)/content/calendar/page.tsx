"use client";

import { useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/shared/ButtonLink";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useContent } from "@/hooks/useContent";
import { PlatformIcon } from "@/components/shared/PlatformIcon";
import { cn } from "@/lib/utils";

const platformColors: Record<string, string> = {
  twitter: "bg-sky-500/20 border-sky-500/50",
  linkedin: "bg-blue-500/20 border-blue-500/50",
  instagram: "bg-pink-500/20 border-pink-500/50",
};

export default function ContentCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { items } = useContent();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getItemsForDay = (day: Date) =>
    items.filter(
      (item) => item.scheduled_at && isSameDay(new Date(item.scheduled_at), day)
    );

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          <p className="text-muted-foreground">Plan and schedule your content.</p>
        </div>
        <ButtonLink href="/content/create" className="bg-accent">
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </ButtonLink>
      </div>

      <Card className="bg-surface border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs text-muted-foreground py-2">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayItems = getItemsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-24 rounded-lg border border-border p-2 transition-colors",
                  !isCurrentMonth && "opacity-40",
                  isToday && "border-accent/50 bg-accent/5"
                )}
              >
                <span className={cn("text-sm", isToday && "text-accent font-semibold")}>
                  {format(day, "d")}
                </span>
                <div className="mt-1 space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "text-xs p-1 rounded border truncate flex items-center gap-1",
                        platformColors[item.platform ?? "twitter"]
                      )}
                    >
                      {item.platform && <PlatformIcon platform={item.platform} size="sm" />}
                      <span className="truncate">{item.body.slice(0, 20)}...</span>
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <p className="text-xs text-muted-foreground">+{dayItems.length - 2} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
