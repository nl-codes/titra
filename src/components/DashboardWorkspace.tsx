"use client";

import { useState } from "react";
import { CalendarDays, List } from "lucide-react";
import { TaskList } from "@/components/TaskList";
import { Timeline } from "@/components/Timeline";
import type { RecurrenceTask, TimelineOccurrence } from "@/lib/recurrence";

type DashboardWorkspaceProps = {
  date: string;
  tasks: RecurrenceTask[];
  occurrences: TimelineOccurrence[];
  unscheduled: RecurrenceTask[];
};

export function DashboardWorkspace({
  date,
  tasks,
  occurrences,
  unscheduled,
}: DashboardWorkspaceProps) {
  const [view, setView] = useState<"timeline" | "list">("timeline");

  return (
    <div className="dashboard-workspace">
      <div className="view-switch" role="tablist" aria-label="Task views">
        <button
          type="button"
          role="tab"
          aria-selected={view === "timeline"}
          className={view === "timeline" ? "active" : ""}
          onClick={() => setView("timeline")}
        >
          <CalendarDays size={15} />
          Timeline
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          className={view === "list" ? "active" : ""}
          onClick={() => setView("list")}
        >
          <List size={15} />
          Tasks
        </button>
      </div>

      {view === "timeline" ? (
        <Timeline
          date={date}
          tasks={tasks}
          occurrences={occurrences}
          unscheduled={unscheduled}
        />
      ) : (
        <TaskList tasks={tasks} />
      )}
    </div>
  );
}
