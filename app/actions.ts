"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { TaskType, RewardType } from "@prisma/client";

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

export async function claimReward(rewardId: string): Promise<{ success: boolean; message: string }> {
  // Check if reward exists
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: { 
      goal: true,
      claims: true 
    },
  });

  if (!reward) {
    return { success: false, message: "獎勵不存在" };
  }

  // Check if already claimed
  if (reward.claims.length > 0) {
    return { success: false, message: "此獎勵已經領取過了" };
  }

  // Calculate total points for the goal
  const totalPointsAgg = await prisma.taskCompletion.aggregate({
    where: { goalId: reward.goalId },
    _sum: { pointsAwarded: true },
  });
  const totalPoints = totalPointsAgg._sum.pointsAwarded ?? 0;

  // Check if reward is unlocked
  let isUnlocked = false;
  if (reward.type === RewardType.GOAL_COMPLETE) {
    isUnlocked = reward.goal.completedAt !== null;
  } else if (reward.type === RewardType.POINT_THRESHOLD) {
    isUnlocked = totalPoints >= (reward.thresholdPoints ?? 0);
  }

  if (!isUnlocked) {
    return { success: false, message: "獎勵尚未解鎖" };
  }

  // Create claim record
  await prisma.rewardClaim.create({
    data: {
      rewardId: reward.id,
    },
  });

  revalidatePath("/");
  return { success: true, message: "獎勵領取成功！" };
}
