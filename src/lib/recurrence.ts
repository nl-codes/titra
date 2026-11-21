import { rrulestr } from "rrule";

export type RecurrenceTask = {
    _id: string;
    title: string;
    description: string;
    durationMinutes: number;
    isRecurring: boolean;
    rruleString: string;
    intradayTimes: string[];
    oneTimeDate: string | null;
    isTracked: boolean;
    trackingConfig?: {
        metricName: string;
        unit: string;
        targetValue?: number;
    };
    color: string;
};

export type TaskLogForOccurrence = {
    taskId: string;
    scheduledDate: string;
    scheduledTime: string;
    status: "completed" | "skipped" | "rescheduled";
    loggedValue?: number | Record<string, unknown>;
    notes?: string;
    completedAt?: string | Date;
    rescheduledDate?: string;
    rescheduledTime?: string;
};

export type TimelineOccurrence = {
    taskId: string;
    title: string;
    description: string;
    durationMinutes: number;
    scheduledDate: string;
    scheduledTime: string;
    isTracked: boolean;
    trackingConfig?: RecurrenceTask["trackingConfig"];
    color: string;
    status: "pending" | "completed" | "skipped" | "rescheduled";
    loggedValue?: number | Record<string, unknown>;
    notes?: string;
    completedAt?: string | Date;
};

function pad(value: number): string {
    return String(value).padStart(2, "0");
}

export function formatDate(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfLocalDay(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function endOfLocalDay(dateString: string): Date {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
}

function normalizeIntradayTimes(times: string[]): string[] {
    return Array.from(
        new Set(times.filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))),
    ).sort();
}

function occursOnDate(task: RecurrenceTask, targetDate: string): boolean {
    if (!task.isRecurring) {
        return task.oneTimeDate === targetDate;
    }

    if (!task.rruleString) {
        return false;
    }

    try {
        const rule = rrulestr(task.rruleString);
        const occurrences = rule.between(
            startOfLocalDay(targetDate),
            endOfLocalDay(targetDate),
            true,
        );
        return occurrences.length > 0;
    } catch {
        return false;
    }
}

export function getTasksForDate(
    tasks: RecurrenceTask[],
    logs: TaskLogForOccurrence[],
    targetDate: string,
): TimelineOccurrence[] {
    const occurrences: TimelineOccurrence[] = [];

    for (const task of tasks) {
        if (!occursOnDate(task, targetDate)) {
            continue;
        }

        const times = normalizeIntradayTimes(task.intradayTimes);
        if (times.length === 0) {
            continue;
        }

        for (const scheduledTime of times) {
            const originalLog = logs.find(
                (log) =>
                    log.taskId === task._id &&
                    log.scheduledDate === targetDate &&
                    log.scheduledTime === scheduledTime,
            );

            if (originalLog?.status === "skipped") {
                continue;
            }

            if (
                originalLog?.status === "rescheduled" &&
                originalLog.rescheduledDate &&
                originalLog.rescheduledTime
            ) {
                continue;
            }

            occurrences.push({
                taskId: task._id,
                title: task.title,
                description: task.description,
                durationMinutes: task.durationMinutes,
                scheduledDate: targetDate,
                scheduledTime,
                isTracked: task.isTracked,
                trackingConfig: task.trackingConfig,
                color: task.color,
                status:
                    originalLog?.status === "completed"
                        ? "completed"
                        : "pending",
                loggedValue: originalLog?.loggedValue,
                notes: originalLog?.notes,
                completedAt: originalLog?.completedAt,
            });
        }
    }

    for (const task of tasks) {
        for (const log of logs) {
            if (
                log.taskId !== task._id ||
                log.status !== "rescheduled" ||
                log.rescheduledDate !== targetDate ||
                !log.rescheduledTime
            ) {
                continue;
            }

            if (
                occurrences.some(
                    (occurrence) =>
                        occurrence.taskId === task._id &&
                        occurrence.scheduledTime === log.rescheduledTime &&
                        occurrence.scheduledDate === targetDate,
                )
            ) {
                continue;
            }

            occurrences.push({
                taskId: task._id,
                title: task.title,
                description: task.description,
                durationMinutes: task.durationMinutes,
                scheduledDate: targetDate,
                scheduledTime: log.rescheduledTime,
                isTracked: task.isTracked,
                trackingConfig: task.trackingConfig,
                color: task.color,
                status: "rescheduled",
                loggedValue: log.loggedValue,
                notes: log.notes,
                completedAt: log.completedAt,
            });
        }
    }

    return occurrences.sort(
        (left, right) =>
            left.scheduledTime.localeCompare(right.scheduledTime) ||
            left.title.localeCompare(right.title),
    );
}
