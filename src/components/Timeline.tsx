"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    CalendarDays,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Inbox,
    SkipForward,
} from "lucide-react";
import type { TimelineOccurrence } from "@/lib/recurrence";
import type { RecurrenceTask } from "@/lib/recurrence";
import {
    rescheduleOccurrence,
    scheduleToToday,
    setOccurrenceStatus,
} from "@/actions/tasks";
import { TaskModal } from "@/components/TaskModal";

type TimelineProps = {
    date: string;
    occurrences: TimelineOccurrence[];
    unscheduled: RecurrenceTask[];
    tasks: RecurrenceTask[];
};

function addDays(date: string, amount: number): string {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(year, month - 1, day + amount);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function formatHeader(date: string): string {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
    }).format(new Date(year, month - 1, day));
}

export function Timeline({
    date,
    occurrences,
    unscheduled,
    tasks,
}: TimelineProps) {
    const router = useRouter();
    const [inboxOpen, setInboxOpen] = useState(false);
    const [rescheduling, setRescheduling] = useState<string | null>(null);
    const inboxButtonRef = useRef<HTMLButtonElement>(null);
    const inboxPanelRef = useRef<HTMLElement>(null);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    useEffect(() => {
        if (!inboxOpen) {
            return;
        }

        function closeOnOutsidePointer(event: PointerEvent) {
            const target = event.target;
            if (!(target instanceof Node)) {
                return;
            }
            if (
                !inboxButtonRef.current?.contains(target) &&
                !inboxPanelRef.current?.contains(target)
            ) {
                setInboxOpen(false);
            }
        }

        document.addEventListener("pointerdown", closeOnOutsidePointer);
        return () =>
            document.removeEventListener("pointerdown", closeOnOutsidePointer);
    }, [inboxOpen]);

    function navigate(nextDate: string) {
        router.push(`/?date=${nextDate}`);
    }

    async function complete(occurrence: TimelineOccurrence) {
        await setOccurrenceStatus({
            taskId: occurrence.taskId,
            scheduledDate: occurrence.scheduledDate,
            scheduledTime: occurrence.scheduledTime,
            status: "completed",
        });
    }

    async function skip(occurrence: TimelineOccurrence) {
        await setOccurrenceStatus({
            taskId: occurrence.taskId,
            scheduledDate: occurrence.scheduledDate,
            scheduledTime: occurrence.scheduledTime,
            status: "skipped",
        });
    }

    async function reschedule(occurrence: TimelineOccurrence, time: string) {
        await rescheduleOccurrence({
            taskId: occurrence.taskId,
            scheduledDate: occurrence.scheduledDate,
            scheduledTime: occurrence.scheduledTime,
            rescheduledDate: occurrence.scheduledDate,
            rescheduledTime: time,
        });
        setRescheduling(null);
    }

    async function scheduleInbox(task: RecurrenceTask, time: string) {
        await scheduleToToday({ taskId: task._id, scheduledTime: time, date });
    }

    return (
        <main className="timeline-page">
            <header className="day-header">
                <div className="date-nav">
                    <button
                        type="button"
                        className="icon-button"
                        aria-label="Previous day"
                        onClick={() => navigate(addDays(date, -1))}>
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        type="button"
                        className="today-button"
                        onClick={() => navigate(today)}>
                        Today
                    </button>
                    <button
                        type="button"
                        className="icon-button"
                        aria-label="Next day"
                        onClick={() => navigate(addDays(date, 1))}>
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="date-heading" aria-label={formatHeader(date)}>
                    <CalendarDays className="date-heading-icon" size={18} />
                    <h1>{formatHeader(date)}</h1>
                </div>
                <button
                    ref={inboxButtonRef}
                    type="button"
                    className="inbox-button"
                    onClick={() => setInboxOpen((current) => !current)}
                    aria-expanded={inboxOpen}>
                    <Inbox size={18} />
                    Inbox
                    {unscheduled.length > 0 && (
                        <span>{unscheduled.length}</span>
                    )}
                </button>
            </header>

            {inboxOpen && (
                <aside ref={inboxPanelRef} className="unscheduled-inbox">
                    {unscheduled.length === 0 ? (
                        <p className="empty-inbox">No unscheduled tasks.</p>
                    ) : (
                        unscheduled.map((task) => (
                            <div className="inbox-item" key={task._id}>
                                <span
                                    className="inbox-dot"
                                    style={{ backgroundColor: task.color }}
                                />
                                <strong>{task.title}</strong>
                                <input
                                    type="time"
                                    defaultValue="09:00"
                                    aria-label={`Time for ${task.title}`}
                                    onBlur={(event) =>
                                        scheduleInbox(task, event.target.value)
                                    }
                                />
                            </div>
                        ))
                    )}
                </aside>
            )}

            <section className="timeline" aria-label="24-hour schedule">
                {Array.from({ length: 24 }, (_, hour) => {
                    const hourSlots = occurrences.filter(
                        (occurrence) =>
                            Number(occurrence.scheduledTime.slice(0, 2)) ===
                            hour,
                    );
                    const showCurrentLine =
                        date === today && now.getHours() === hour;

                    return (
                        <div className="hour-row" key={hour}>
                            <time className="hour-label">
                                {hour === 0
                                    ? "12 AM"
                                    : hour < 12
                                      ? `${hour} AM`
                                      : hour === 12
                                        ? "12 PM"
                                        : `${hour - 12} PM`}
                            </time>
                            <div className="hour-content">
                                {showCurrentLine && (
                                    <div
                                        className="current-line"
                                        style={{
                                            top: `${((currentMinutes % 60) / 60) * 100}%`,
                                        }}>
                                        <span />
                                    </div>
                                )}
                                {hourSlots.map((occurrence) => {
                                    const key = `${occurrence.taskId}-${occurrence.scheduledTime}`;
                                    return (
                                        <article
                                            className={`task-block ${occurrence.status === "completed" ? "completed" : ""}`}
                                            style={{
                                                borderLeftColor:
                                                    occurrence.color,
                                                height: `${Math.max(58, occurrence.durationMinutes * 0.9)}px`,
                                            }}
                                            key={key}>
                                            <button
                                                type="button"
                                                className="completion-button"
                                                aria-label={`Complete ${occurrence.title}`}
                                                onClick={() =>
                                                    complete(occurrence)
                                                }>
                                                {occurrence.status ===
                                                    "completed" && (
                                                    <Check size={14} />
                                                )}
                                            </button>
                                            <div className="task-content">
                                                <div className="task-time">
                                                    <Clock3 size={13} />
                                                    {occurrence.scheduledTime}
                                                </div>
                                                <strong>
                                                    {occurrence.title}
                                                </strong>
                                                {occurrence.description && (
                                                    <p>
                                                        {occurrence.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="task-actions">
                                                {tasks.find(
                                                    (task) =>
                                                        task._id ===
                                                        occurrence.taskId,
                                                ) && (
                                                    <TaskModal
                                                        initialTask={tasks.find(
                                                            (task) =>
                                                                task._id ===
                                                                occurrence.taskId,
                                                        )}
                                                        editTrigger
                                                        iconOnly
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    aria-label={`Skip ${occurrence.title}`}
                                                    onClick={() =>
                                                        skip(occurrence)
                                                    }>
                                                    <SkipForward size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Reschedule ${occurrence.title}`}
                                                    onClick={() =>
                                                        setRescheduling(
                                                            rescheduling === key
                                                                ? null
                                                                : key,
                                                        )
                                                    }>
                                                    <Clock3 size={15} />
                                                </button>
                                            </div>
                                            {rescheduling === key && (
                                                <div className="reschedule-popover">
                                                    <input
                                                        type="time"
                                                        defaultValue={
                                                            occurrence.scheduledTime
                                                        }
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key ===
                                                                "Enter"
                                                            ) {
                                                                reschedule(
                                                                    occurrence,
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={(event) => {
                                                            const input = event
                                                                .currentTarget
                                                                .previousElementSibling as HTMLInputElement;
                                                            reschedule(
                                                                occurrence,
                                                                input.value,
                                                            );
                                                        }}>
                                                        Move
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </section>
        </main>
    );
}
