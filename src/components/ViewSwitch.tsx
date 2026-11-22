"use client";

import { CalendarDays, List } from "lucide-react";

export type TaskView = "timeline" | "list";

export function ViewSwitch({
  view,
  onChange,
}: {
  view: TaskView;
  onChange: (view: TaskView) => void;
}) {
  return (
    <div className="view-switch" role="tablist" aria-label="Task views">
      <button
        type="button"
        role="tab"
        aria-selected={view === "timeline"}
        className={view === "timeline" ? "active" : ""}
        onClick={() => onChange("timeline")}
      >
        <CalendarDays size={15} />
        Timeline
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={view === "list"}
        className={view === "list" ? "active" : ""}
        onClick={() => onChange("list")}
      >
        <List size={15} />
        Tasks
      </button>
    </div>
  );
}
