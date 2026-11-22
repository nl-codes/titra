"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, Repeat2, Target, X } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";
import type { RecurrenceTask } from "@/lib/recurrence";

function recurrenceLabel(task: RecurrenceTask): string {
  if (!task.isRecurring) {
    return task.oneTimeDate
      ? `One time · ${task.oneTimeDate}`
      : "One time";
  }

  const rule = task.rruleString.toUpperCase();
  if (rule.includes("BYDAY=MO,TU,WE,TH,FR") || rule.includes("BYDAY=MO,TU,WE,TH,FR;")) {
    return "Weekdays";
  }
  if (rule.includes("BYDAY=")) {
    const byDay = rule.match(/BYDAY=([^;]+)/)?.[1] ?? "";
    return byDay
      ? `Weekly · ${byDay
          .split(",")
          .map((day) => ({ MO: "Mon", TU: "Tue", WE: "Wed", TH: "Thu", FR: "Fri", SA: "Sat", SU: "Sun" }[day] ?? day))
          .join(", ")}`
      : "Weekly";
  }
  if (rule.includes("INTERVAL=")) {
    const interval = Number(rule.match(/INTERVAL=(\d+)/)?.[1] ?? 1);
    return interval > 1 ? `Every ${interval} days` : "Daily";
  }
  if (rule.includes("FREQ=DAILY")) {
    return "Daily";
  }
  if (rule.includes("FREQ=WEEKLY")) {
    return "Weekly";
  }
  return "Recurring";
}

export function TaskList({ tasks }: { tasks: RecurrenceTask[] }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedTaskId(null);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const selectedTask = tasks.find((task) => task._id === selectedTaskId) ?? null;

  return (
    <main className="task-list-page">
      <header className="list-header">
        <div>
          <p className="eyebrow">Task library</p>
          <h1>All tasks</h1>
        </div>
        <span className="task-count">{tasks.length}</span>
      </header>

      {tasks.length === 0 ? (
        <div className="empty-task-list">
          <p>No tasks yet.</p>
          <span>Create a task to add it to your library.</span>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div
              className="task-list-row"
              key={task._id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTaskId(task._id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  setSelectedTaskId(task._id);
                }
              }}
            >
              <span className="task-list-color" style={{ backgroundColor: task.color }} />
              <span className="task-list-main">
                <strong>{task.title}</strong>
                {task.description && <small>{task.description}</small>}
              </span>
              <span className="task-list-meta">
                <span><Clock3 size={14} /> {task.durationMinutes} min</span>
                <span><Repeat2 size={14} /> {recurrenceLabel(task)}</span>
              </span>
              <span
                className="task-list-edit"
                onClick={(event) => event.stopPropagation()}
              >
                <TaskModal initialTask={task} editTrigger iconOnly />
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedTask &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="task-detail-backdrop"
            role="presentation"
            onMouseDown={() => setSelectedTaskId(null)}
          >
            <aside
              className="task-detail-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="task-detail-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <header className="task-detail-header">
                <span className="task-detail-color" style={{ backgroundColor: selectedTask.color }} />
                <span className="task-detail-actions">
                  <TaskModal initialTask={selectedTask} editTrigger />
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="Close task details"
                    onClick={() => setSelectedTaskId(null)}
                  >
                    <X size={20} />
                  </button>
                </span>
              </header>

              <p className="eyebrow">Task details</p>
              <h2 id="task-detail-title">{selectedTask.title}</h2>
              {selectedTask.description && (
                <p className="task-detail-description">{selectedTask.description}</p>
              )}

              <dl className="task-detail-grid">
                <div>
                  <dt><Clock3 size={14} /> Duration</dt>
                  <dd>{selectedTask.durationMinutes} minutes</dd>
                </div>
                <div>
                  <dt><Repeat2 size={14} /> Recurrence</dt>
                  <dd>{recurrenceLabel(selectedTask)}</dd>
                </div>
                <div>
                  <dt><Clock3 size={14} /> Scheduled times</dt>
                  <dd>
                    {selectedTask.intradayTimes.length > 0
                      ? selectedTask.intradayTimes.join(", ")
                      : "Unscheduled"}
                  </dd>
                </div>
                {selectedTask.isTracked && (
                  <div>
                    <dt><Target size={14} /> Tracking</dt>
                    <dd>
                      {selectedTask.trackingConfig?.metricName || "Custom metric"}
                      {selectedTask.trackingConfig?.unit
                        ? ` (${selectedTask.trackingConfig.unit})`
                        : ""}
                      {selectedTask.trackingConfig?.targetValue != null
                        ? ` · Target ${selectedTask.trackingConfig.targetValue}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>
            </aside>
          </div>,
          document.body,
        )}
    </main>
  );
}
