"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
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

function parseTaskType(value: FormDataEntryValue | null): TaskType {
  const type = parseString(value, "type");
  if (type === "DAILY") return TaskType.DAILY;
  if (type === "WEEKLY") return TaskType.WEEKLY;
  if (type === "ONE_TIME") return TaskType.ONE_TIME;
  throw new Error("Invalid type");
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

export async function updateGoal(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");
  const title = parseString(formData.get("title"), "title");
  const assigneeId = parseString(formData.get("assigneeId"), "assigneeId");
  const startAt = parseDateOnly(formData.get("startAt"));
  const endAt = parseDateOnly(formData.get("endAt"));
  const weeklyStartAt = parseDateOnly(formData.get("weeklyStartAt"));

  if (startAt.getTime() > endAt.getTime()) {
    throw new Error("startAt must be <= endAt");
  }
  if (weeklyStartAt.getTime() < startAt.getTime() || weeklyStartAt.getTime() > endAt.getTime()) {
    throw new Error("weeklyStartAt must be within goal start/end");
  }

  await prisma.goal.update({
    where: { id: goalId },
    data: {
      title,
      assigneeId,
      startAt,
      endAt,
      weeklyStartAt,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteGoal(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");

  await prisma.goal.delete({
    where: { id: goalId },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createTask(formData: FormData) {
  const goalId = parseString(formData.get("goalId"), "goalId");
  const title = parseString(formData.get("title"), "title");
  const taskType = parseTaskType(formData.get("type"));
  const points = parseIntField(formData.get("points"), "points");

  if (points < 0) {
    throw new Error("points must be >= 0");
  }

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

export async function updateTask(formData: FormData) {
  const taskId = parseString(formData.get("taskId"), "taskId");
  const goalId = parseString(formData.get("goalId"), "goalId");
  const title = parseString(formData.get("title"), "title");
  const taskType = parseTaskType(formData.get("type"));
  const points = parseIntField(formData.get("points"), "points");

  if (points < 0) {
    throw new Error("points must be >= 0");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      goalId,
      title,
      type: taskType,
      points,
    },
  });

  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteTask(formData: FormData) {
  const taskId = parseString(formData.get("taskId"), "taskId");

  await prisma.task.update({
    where: { id: taskId },
    data: { isActive: false },
  });

  revalidatePath("/admin/tasks");
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

export async function updateReward(formData: FormData) {
  const rewardId = parseString(formData.get("rewardId"), "rewardId");
  const title = parseString(formData.get("title"), "title");
  const type = parseString(formData.get("type"), "type");

  if (type !== RewardType.POINT_THRESHOLD && type !== RewardType.GOAL_COMPLETE) {
    throw new Error("Invalid reward type");
  }

  let thresholdPoints: number | null = null;
  if (type === RewardType.POINT_THRESHOLD) {
    thresholdPoints = parseIntField(formData.get("thresholdPoints"), "thresholdPoints");
    if (thresholdPoints < 0) {
      throw new Error("thresholdPoints must be >= 0");
    }
  }

  await prisma.reward.update({
    where: { id: rewardId },
    data: {
      title,
      thresholdPoints,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/");
}

export async function deleteReward(formData: FormData) {
  const rewardId = parseString(formData.get("rewardId"), "rewardId");

  const deleted = await prisma.reward.deleteMany({
    where: {
      id: rewardId,
      claims: {
        none: {},
      },
    },
  });

  if (deleted.count === 0) {
    throw new Error("Reward cannot be deleted");
  }

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
      : task.type === TaskType.WEEKLY
      ? weeklyPeriodStartUtc({ now, weeklyStartAt: task.goal.weeklyStartAt })
      : task.goal.startAt; // ONE_TIME uses goal startAt as periodStart

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
      : task.type === TaskType.WEEKLY
      ? weeklyPeriodStartUtc({ now: targetDate, weeklyStartAt: task.goal.weeklyStartAt })
      : task.goal.startAt; // ONE_TIME uses goal startAt as periodStart

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
