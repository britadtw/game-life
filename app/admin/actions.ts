"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dayStartUtc, isMultipleOf7DaysUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { RewardType, TaskType } from "@prisma/client";

function parseDateOnly(value: FormDataEntryValue | null): Date {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Missing date");
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return parsed;
}

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

function parseIntField(value: FormDataEntryValue | null, field: string): number {
  const raw = parseString(value, field);
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${field}`);
  }
  return parsed;
}

export async function createPerson(formData: FormData) {
  const name = parseString(formData.get("name"), "name");

  await prisma.person.create({
    data: { name },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createGoal(formData: FormData) {
  const title = parseString(formData.get("title"), "title");
  const assigneeId = parseString(formData.get("assigneeId"), "assigneeId");
  const startAt = parseDateOnly(formData.get("startAt"));
  const endAt = parseDateOnly(formData.get("endAt"));
  const weeklyStartAt = parseDateOnly(formData.get("weeklyStartAt"));
  const completeRewardTitle = parseString(
    formData.get("completeRewardTitle"),
    "completeRewardTitle",
  );

  if (startAt.getTime() > endAt.getTime()) {
    throw new Error("startAt must be <= endAt");
  }
  if (weeklyStartAt.getTime() < startAt.getTime() || weeklyStartAt.getTime() > endAt.getTime()) {
    throw new Error("weeklyStartAt must be within goal start/end");
  }
  if (!isMultipleOf7DaysUtc({ start: weeklyStartAt, end: endAt })) {
    throw new Error("endAt must be a multiple of 7 days from weeklyStartAt");
  }

  await prisma.goal.create({
    data: {
      title,
      assigneeId,
      startAt,
      endAt,
      weeklyStartAt,
      rewards: {
        create: {
          type: RewardType.GOAL_COMPLETE,
          title: completeRewardTitle,
        },
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createTask(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");
  const title = parseString(formData.get("title"), "title");
  const type = parseString(formData.get("type"), "type");
  const points = parseIntField(formData.get("points"), "points");

  if (points < 0) {
    throw new Error("points must be >= 0");
  }

  const taskType = type === "DAILY" ? TaskType.DAILY : TaskType.WEEKLY;

  await prisma.task.create({
    data: {
      goalId,
      title,
      type: taskType,
      points,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createPointReward(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");
  const title = parseString(formData.get("title"), "title");
  const thresholdPoints = parseIntField(formData.get("thresholdPoints"), "thresholdPoints");

  if (thresholdPoints < 0) {
    throw new Error("thresholdPoints must be >= 0");
  }

  await prisma.reward.create({
    data: {
      goalId,
      type: RewardType.POINT_THRESHOLD,
      title,
      thresholdPoints,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
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

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function completeGoal(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");

  await prisma.goal.updateMany({
    where: { id: goalId, completedAt: null },
    data: { completedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function backfillTaskCompletion(formData: FormData) {
  const taskId = parseString(formData.get("taskId"), "taskId");
  const dateStr = parseString(formData.get("date"), "date");
  const action = formData.get("action")?.toString() ?? "complete";

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { goal: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Parse the date and compute the period start
  const targetDate = new Date(dateStr);
  if (Number.isNaN(targetDate.getTime())) {
    throw new Error("Invalid date");
  }

  const periodStart =
    task.type === TaskType.DAILY
      ? dayStartUtc(targetDate)
      : weeklyPeriodStartUtc({ now: targetDate, weeklyStartAt: task.goal.weeklyStartAt });

  if (action === "uncomplete") {
    // Delete the completion record
    await prisma.taskCompletion.deleteMany({
      where: {
        taskId: task.id,
        periodStart,
      },
    });
  } else {
    // Create or update the completion record
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
  }

  revalidatePath("/admin");
  revalidatePath("/");
}
