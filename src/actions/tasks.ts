"use server";

import { revalidatePath } from "next/cache";
import { RRule, Frequency } from "rrule";
import { connectToDatabase } from "@/lib/db";
import { TaskModel } from "@/models/Task";
import { TaskLogModel } from "@/models/TaskLog";

export type CreateTaskInput = {
  title: string;
  description: string;
  durationMinutes: number;
  recurrence: "one-time" | "daily" | "weekdays" | "every-n-days" | "weekly";
  oneTimeDate: string;
  time: string;
  interval: number;
  weekdays: number[];
  isTracked: boolean;
  metricName: string;
  unit: string;
  targetValue: number | null;
  color: string;
};

function recurrenceRule(
  input: CreateTaskInput,
  startDate: Date,
): string {
  if (input.recurrence === "one-time") {
    return "";
  }

  const options: ConstructorParameters<typeof RRule>[0] = {
    dtstart: startDate,
  };

  if (input.recurrence === "daily") {
    options.freq = Frequency.DAILY;
  } else if (input.recurrence === "weekdays") {
    options.freq = Frequency.WEEKLY;
    options.byweekday =
      input.weekdays.length > 0
        ? input.weekdays.map((day) => [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU][day - 1])
        : [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
  } else if (input.recurrence === "every-n-days") {
    options.freq = Frequency.DAILY;
    options.interval = Math.max(1, input.interval);
  } else {
    options.freq = Frequency.WEEKLY;
  }

  return new RRule(options).toString();
}

function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export async function createTask(input: CreateTaskInput): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!input.title.trim()) {
    return { success: false, error: "Task title is required." };
  }

  if (
    input.recurrence !== "one-time" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.oneTimeDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time) ||
      !Number.isFinite(input.durationMinutes) ||
      input.durationMinutes < 1)
  ) {
    return { success: false, error: "Choose a valid date and enter a valid time and duration." };
  }

  if (
    input.recurrence === "one-time" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(input.oneTimeDate) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time))
  ) {
    return { success: false, error: "Choose a valid date and time." };
  }

  try {
    await connectToDatabase();
    const startDate = parseLocalDate(input.oneTimeDate);

    await TaskModel.create({
      userId: "demo-user",
      title: input.title.trim(),
      description: input.description.trim(),
      durationMinutes: input.durationMinutes,
      isRecurring: input.recurrence !== "one-time",
      rruleString: recurrenceRule(input, startDate),
      intradayTimes: input.time ? [input.time] : [],
      oneTimeDate: input.recurrence === "one-time" ? input.oneTimeDate : null,
      isTracked: input.isTracked,
      trackingConfig: input.isTracked
        ? {
            metricName: input.metricName.trim(),
            unit: input.unit.trim(),
            targetValue: input.targetValue ?? undefined,
          }
        : undefined,
      color: input.color,
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not create task.",
    };
  }
}

export async function setOccurrenceStatus(input: {
  taskId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "completed" | "skipped";
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    await TaskLogModel.updateOne(
      {
        taskId: input.taskId,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
      },
      {
        $set: {
          userId: "demo-user",
          status: input.status,
          completedAt:
            input.status === "completed" ? new Date() : undefined,
        },
        $unset:
          input.status === "skipped"
            ? { rescheduledDate: "", rescheduledTime: "" }
            : { rescheduledDate: "", rescheduledTime: "" },
      },
      { upsert: true },
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not update task.",
    };
  }
}

export async function rescheduleOccurrence(input: {
  taskId: string;
  scheduledDate: string;
  scheduledTime: string;
  rescheduledDate: string;
  rescheduledTime: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    await TaskLogModel.updateOne(
      {
        taskId: input.taskId,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
      },
      {
        $set: {
          userId: "demo-user",
          status: "rescheduled",
          rescheduledDate: input.rescheduledDate,
          rescheduledTime: input.rescheduledTime,
        },
      },
      { upsert: true },
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not reschedule.",
    };
  }
}

export async function scheduleToToday(input: {
  taskId: string;
  scheduledTime: string;
  date: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase();
    await TaskModel.updateOne(
      { _id: input.taskId, userId: "demo-user" },
      {
        $set: {
          isRecurring: false,
          rruleString: "",
          intradayTimes: [input.scheduledTime],
          oneTimeDate: input.date,
        },
      },
    );
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not schedule task.",
    };
  }
}
