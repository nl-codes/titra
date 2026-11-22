"use client";

import { TaskList } from "@/components/TaskList";
import { Timeline } from "@/components/Timeline";
import type { RecurrenceTask, TimelineOccurrence } from "@/lib/recurrence";

type DashboardWorkspaceProps = {
  date: string;
  tasks: RecurrenceTask[];
  occurrences: TimelineOccurrence[];
  unscheduled: RecurrenceTask[];
  view: "timeline" | "list";
};

export function DashboardWorkspace({
  date,
  tasks,
  occurrences,
  unscheduled,
  view,
}: DashboardWorkspaceProps) {
  return (
    <div className="dashboard-workspace">
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
