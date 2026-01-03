"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { TaskType } from "@prisma/client";

function parseString(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`Missing ${field}`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Missing ${field}`);
  }
  return trimmed;
}

export async function completeTask(formData: FormData) {
  const taskId = parseString(formData.get("taskId"), "taskId");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { goal: true },
  });

  if (!task || !task.isActive) {
    throw new Error("Task not found");
  }

  const now = new Date();
  const periodStart =
    task.type === TaskType.DAILY
      ? dayStartUtc(now)
      : weeklyPeriodStartUtc({ now, weeklyStartAt: task.goal.weeklyStartAt });

  await prisma.taskCompletion.upsert({
    where: {
      taskId_periodStart: {
        taskId: task.id,
        periodStart,
      },
    },
    create: {
      taskId: task.id,
      goalId: task.goalId,
      periodStart,
      pointsAwarded: task.points,
    },
    update: {},
  });

  revalidatePath("/");
}
