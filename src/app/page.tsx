import { AppShell } from "@/components/AppShell";
import { connectToDatabase } from "@/lib/db";
import {
  getTasksForDate,
  type RecurrenceTask,
  type TaskLogForOccurrence,
} from "@/lib/recurrence";
import { TaskModel } from "@/models/Task";
import { TaskLogModel } from "@/models/TaskLog";
import { connection } from "next/server";

export const instant = false;

function todayString(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[] }>;
}) {
  await connection();
  const params = await searchParams;
  const requestedDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const date =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : todayString();

  await connectToDatabase();

  const taskDocuments = await TaskModel.find({ userId: "demo-user" }).lean().exec();
  const tasks: RecurrenceTask[] = taskDocuments.map((task) => ({
    _id: String(task._id),
    title: task.title,
    description: task.description ?? "",
    durationMinutes: task.durationMinutes,
    isRecurring: task.isRecurring,
    rruleString: task.rruleString ?? "",
    intradayTimes: task.intradayTimes ?? [],
    oneTimeDate: task.oneTimeDate ?? null,
    isTracked: task.isTracked,
    trackingConfig: task.trackingConfig
      ? {
          metricName: task.trackingConfig.metricName ?? "",
          unit: task.trackingConfig.unit ?? "",
          targetValue: task.trackingConfig.targetValue ?? undefined,
        }
      : undefined,
    color: task.color ?? "#2563eb",
  }));

  const logDocuments = await TaskLogModel.find({
    userId: "demo-user",
    $or: [{ scheduledDate: date }, { rescheduledDate: date }],
  })
    .lean()
    .exec();
  const logs: TaskLogForOccurrence[] = logDocuments.map((log) => ({
    taskId: String(log.taskId),
    scheduledDate: log.scheduledDate,
    scheduledTime: log.scheduledTime,
    status: log.status,
    loggedValue: log.loggedValue as number | Record<string, unknown> | undefined,
    notes: log.notes ?? undefined,
    completedAt: log.completedAt ?? undefined,
    rescheduledDate: log.rescheduledDate ?? undefined,
    rescheduledTime: log.rescheduledTime ?? undefined,
  }));

  const occurrences = getTasksForDate(tasks, logs, date);
  const unscheduled = tasks.filter(
    (task) => !task.intradayTimes || task.intradayTimes.length === 0,
  );

  return (
    <AppShell
      date={date}
      tasks={tasks}
      occurrences={occurrences}
      unscheduled={unscheduled}
    />
  );
}
