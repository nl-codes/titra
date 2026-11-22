"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, X } from "lucide-react";
import {
  createTask,
  updateTask,
  type CreateTaskInput,
} from "@/actions/tasks";
import type { RecurrenceTask } from "@/lib/recurrence";

const colors = [
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#a855f7",
  "#db2777",
  "#e11d48",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#059669",
  "#0d9488",
  "#0891b2",
];

function inferTaskForm(task: RecurrenceTask | undefined): {
  recurrence: CreateTaskInput["recurrence"];
  interval: number;
  weekdays: number[];
  startDate: string;
} {
  if (!task) {
    return { recurrence: "one-time", interval: 2, weekdays: [], startDate: "" };
  }
  if (!task.isRecurring) {
    return {
      recurrence: "one-time",
      interval: 2,
      weekdays: [],
      startDate: task.oneTimeDate ?? "",
    };
  }

  const rule = task.rruleString.toUpperCase();
  const interval = Number(rule.match(/INTERVAL=(\d+)/)?.[1] ?? 1);
  const byDay = rule.match(/BYDAY=([^;\n]+)/)?.[1] ?? "";
  const dayMap: Record<string, number> = {
    MO: 1,
    TU: 2,
    WE: 3,
    TH: 4,
    FR: 5,
    SA: 6,
    SU: 7,
  };
  const weekdays = byDay
    .split(",")
    .map((day) => dayMap[day])
    .filter((day) => day != null);

  const dateMatch = rule.match(/DTSTART(?:;[^:]*)?:(\d{4})(\d{2})(\d{2})/);
  const startDate = dateMatch
    ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`
    : task.oneTimeDate ?? "";

  if (rule.includes("FREQ=WEEKLY") && weekdays.length > 0) {
    const weekdaysOnly = weekdays.length === 5 &&
      [1, 2, 3, 4, 5].every((day) => weekdays.includes(day));
    return {
      recurrence: weekdaysOnly ? "weekdays" : "weekdays",
      interval,
      weekdays,
      startDate,
    };
  }
  if (rule.includes("FREQ=DAILY") && interval > 1) {
    return { recurrence: "every-n-days", interval, weekdays, startDate };
  }
  if (rule.includes("FREQ=DAILY")) {
    return { recurrence: "daily", interval, weekdays, startDate };
  }
  if (rule.includes("FREQ=WEEKLY")) {
    return { recurrence: "weekly", interval, weekdays, startDate };
  }
  return { recurrence: "daily", interval, weekdays, startDate };
}

export function TaskModal({
  compact = false,
  initialTask,
  editTrigger = false,
  iconOnly = false,
}: {
  compact?: boolean;
  initialTask?: RecurrenceTask;
  editTrigger?: boolean;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const initialForm = inferTaskForm(initialTask);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function submit(formData: FormData) {
    setSubmitting(true);
    setError("");

    const recurrence =
      String(formData.get("recurrence")) as CreateTaskInput["recurrence"];
    const weekdays = Array.from({ length: 7 }, (_, index) => index + 1).filter(
      (day) => formData.get(`weekday-${day}`) === String(day),
    );
    const targetValue = String(formData.get("targetValue"));

    const input: CreateTaskInput = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      durationMinutes: Number(formData.get("durationMinutes")),
      recurrence,
      oneTimeDate: String(formData.get("oneTimeDate") ?? ""),
      time: String(formData.get("time") ?? "09:00"),
      interval: Number(formData.get("interval") ?? 1),
      weekdays,
      isTracked: formData.get("isTracked") === "on",
      metricName: String(formData.get("metricName") ?? ""),
      unit: String(formData.get("unit") ?? ""),
      targetValue: targetValue ? Number(targetValue) : null,
      color: String(formData.get("color") ?? colors[0]),
    };

    const result = initialTask
      ? await updateTask(initialTask._id, input)
      : await createTask(input);
    if (!result.success) {
      setError(result.error ?? "Could not create task.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setOpen(false);
  }

  return (
    <>
      <button
        className={
          editTrigger
            ? "task-edit-button"
            : compact
              ? "primary-button mobile-create-button"
              : "primary-button"
        }
        type="button"
        aria-label={initialTask ? `Edit ${initialTask.title}` : "Create new task"}
        onClick={() => setOpen(true)}
      >
        {initialTask ? <Pencil size={15} /> : <Plus size={18} />}
        {!iconOnly && (
          <span>{initialTask ? "Edit" : compact ? "" : "New task"}</span>
        )}
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div>
                <p className="eyebrow">{initialTask ? "Edit block" : "Create block"}</p>
                <h2 id="task-modal-title">{initialTask ? "Edit task" : "New task"}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <form action={submit} className="task-form">
              <label>
                Task title
                <input
                  name="title"
                  required
                  placeholder="Deep work session"
                  defaultValue={initialTask?.title ?? ""}
                />
              </label>
              <label>
                Description
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Optional notes"
                  defaultValue={initialTask?.description ?? ""}
                />
              </label>

              <div className="form-grid">
                <label>
                  Duration
                  <span className="input-suffix">
                    <input
                      name="durationMinutes"
                      type="number"
                      min="1"
                      defaultValue={initialTask?.durationMinutes ?? 30}
                      required
                    />
                    <span>min</span>
                  </span>
                </label>
                <label>
                  Time
                  <input
                    name="time"
                    type="time"
                    defaultValue={initialTask?.intradayTimes[0] ?? "09:00"}
                    required
                  />
                </label>
              </div>

              <label>
                Repeat
                <select name="recurrence" defaultValue={initialForm.recurrence}>
                  <option value="one-time">One time</option>
                  <option value="daily">Every day</option>
                  <option value="weekdays">Selected weekdays</option>
                  <option value="every-n-days">Every N days</option>
                  <option value="weekly">Every week</option>
                </select>
              </label>

              <div className="form-grid">
                <label>
                  Date
                  <input
                    name="oneTimeDate"
                    type="date"
                    defaultValue={
                      initialForm.startDate ||
                      new Date().toLocaleDateString("en-CA")
                    }
                  />
                </label>
                <label>
                  Interval
                  <input name="interval" type="number" min="1" defaultValue={initialForm.interval} />
                </label>
              </div>

              <fieldset className="weekday-fieldset">
                <legend>Weekdays</legend>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <label className="weekday" key={day}>
                    <input
                      type="checkbox"
                      name={`weekday-${day}`}
                      value={day}
                      defaultChecked={initialForm.weekdays.includes(day)}
                    />
                    {["M", "T", "W", "T", "F", "S", "S"][day - 1]}
                  </label>
                ))}
                <input type="hidden" name="weekdays" value="" />
              </fieldset>

              <label className="toggle-row">
                <span>
                  <strong>Enable data tracking</strong>
                  <small>Log a value when completing this task</small>
                </span>
                <input
                  name="isTracked"
                  type="checkbox"
                  defaultChecked={initialTask?.isTracked ?? false}
                />
              </label>

              <div className="form-grid">
                <label>
                  Metric
                  <input
                    name="metricName"
                    placeholder="Distance"
                    defaultValue={initialTask?.trackingConfig?.metricName ?? ""}
                  />
                </label>
                <label>
                  Unit
                  <input
                    name="unit"
                    placeholder="km"
                    defaultValue={initialTask?.trackingConfig?.unit ?? ""}
                  />
                </label>
                <label>
                  Target
                  <input
                    name="targetValue"
                    type="number"
                    step="any"
                    placeholder="5"
                    defaultValue={initialTask?.trackingConfig?.targetValue ?? ""}
                  />
                </label>
              </div>

              <fieldset className="color-fieldset">
                <legend>Color</legend>
                {colors.map((color) => (
                  <label key={color}>
                    <input
                      type="radio"
                      name="color"
                      value={color}
                      defaultChecked={
                        color === (initialTask?.color ?? colors[0])
                      }
                    />
                    <span style={{ backgroundColor: color }} />
                  </label>
                ))}
              </fieldset>

              {error && <p className="form-error">{error}</p>}

              <button className="primary-button full-width" type="submit" disabled={submitting}>
                {submitting
                  ? initialTask
                    ? "Saving..."
                    : "Creating..."
                  : initialTask
                    ? "Save changes"
                    : "Create task"}
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
