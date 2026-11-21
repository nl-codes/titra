"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { createTask, type CreateTaskInput } from "@/actions/tasks";

const colors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669"];

export function TaskModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    const result = await createTask(input);
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
      <button className="primary-button" type="button" onClick={() => setOpen(true)}>
        <Plus size={18} />
        New task
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
                <p className="eyebrow">Create block</p>
                <h2 id="task-modal-title">New task</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <form action={submit} className="task-form">
              <label>
                Task title
                <input name="title" required placeholder="Deep work session" />
              </label>
              <label>
                Description
                <textarea name="description" rows={2} placeholder="Optional notes" />
              </label>

              <div className="form-grid">
                <label>
                  Duration
                  <span className="input-suffix">
                    <input name="durationMinutes" type="number" min="1" defaultValue="30" required />
                    <span>min</span>
                  </span>
                </label>
                <label>
                  Time
                  <input name="time" type="time" defaultValue="09:00" required />
                </label>
              </div>

              <label>
                Repeat
                <select name="recurrence" defaultValue="one-time">
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
                  <input name="oneTimeDate" type="date" defaultValue={new Date().toLocaleDateString("en-CA")} />
                </label>
                <label>
                  Interval
                  <input name="interval" type="number" min="1" defaultValue="2" />
                </label>
              </div>

              <fieldset className="weekday-fieldset">
                <legend>Weekdays</legend>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <label className="weekday" key={day}>
                    <input type="checkbox" name={`weekday-${day}`} value={day} />
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
                <input name="isTracked" type="checkbox" />
              </label>

              <div className="form-grid">
                <label>
                  Metric
                  <input name="metricName" placeholder="Distance" />
                </label>
                <label>
                  Unit
                  <input name="unit" placeholder="km" />
                </label>
                <label>
                  Target
                  <input name="targetValue" type="number" step="any" placeholder="5" />
                </label>
              </div>

              <fieldset className="color-fieldset">
                <legend>Color</legend>
                {colors.map((color) => (
                  <label key={color}>
                    <input type="radio" name="color" value={color} defaultChecked={color === colors[0]} />
                    <span style={{ backgroundColor: color }} />
                  </label>
                ))}
              </fieldset>

              {error && <p className="form-error">{error}</p>}

              <button className="primary-button full-width" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create task"}
              </button>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </>
  );
}
