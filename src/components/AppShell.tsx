"use client";

import { useState } from "react";
import { TaskModal } from "@/components/TaskModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MobileNavigation } from "@/components/MobileNavigation";
import { DashboardWorkspace } from "@/components/DashboardWorkspace";
import { ViewSwitch, type TaskView } from "@/components/ViewSwitch";
import type { RecurrenceTask, TimelineOccurrence } from "@/lib/recurrence";

export function AppShell({
  date,
  tasks,
  occurrences,
  unscheduled,
}: {
  date: string;
  tasks: RecurrenceTask[];
  occurrences: TimelineOccurrence[];
  unscheduled: RecurrenceTask[];
}) {
  const [view, setView] = useState<TaskView>("timeline");

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">Titra</div>
        <TaskModal />
        <ThemeToggle />
        <ViewSwitch view={view} onChange={setView} />
      </aside>
      <MobileNavigation view={view} onViewChange={setView} />
      <DashboardWorkspace
        date={date}
        tasks={tasks}
        occurrences={occurrences}
        unscheduled={unscheduled}
        view={view}
      />
    </div>
  );
}
