import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { RewardType, TaskType } from "@prisma/client";
import AdminLayout from "../components/AdminLayout";
import { completeGoal, completeTask } from "./actions";
import AdminGoalsClient from "./AdminGoalsClient";

export const dynamic = "force-dynamic";

type GoalView = {
  id: string;
  title: string;
  assigneeName: string;
  isCompleted: boolean;
  startAt: Date;
  endAt: Date;
  daily: { done: number; total: number };
  weekly: { done: number; total: number };
  oneTime: { done: number; total: number };
  totalPoints: number;
  rewards: Array<{ id: string; title: string; achieved: boolean; type: RewardType }>;
  tasks: Array<{
    id: string;
    title: string;
    type: TaskType;
    points: number;
    done: boolean;
  }>;
};

async function buildGoalView(goalId: string): Promise<GoalView> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      assignee: true,
      tasks: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      rewards: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  const now = new Date();
  const todayStart = dayStartUtc(now);
  const weekStart = weeklyPeriodStartUtc({ now, weeklyStartAt: goal.weeklyStartAt });
  const goalStart = goal.startAt;

  const completions = await prisma.taskCompletion.findMany({
    where: {
      goalId: goal.id,
      periodStart: { in: [todayStart, weekStart, goalStart] },
    },
    select: { taskId: true, periodStart: true },
  });

  const doneToday = new Set(
    completions.filter((c) => c.periodStart.getTime() === todayStart.getTime()).map((c) => c.taskId),
  );
  const doneWeek = new Set(
    completions.filter((c) => c.periodStart.getTime() === weekStart.getTime()).map((c) => c.taskId),
  );
  const doneOneTime = new Set(
    completions.filter((c) => c.periodStart.getTime() === goalStart.getTime()).map((c) => c.taskId),
  );

  const totalPointsAgg = await prisma.taskCompletion.aggregate({
    where: { goalId: goal.id },
    _sum: { pointsAwarded: true },
  });
  const totalPoints = totalPointsAgg._sum.pointsAwarded ?? 0;

  const dailyTasks = goal.tasks.filter((t) => t.type === TaskType.DAILY);
  const weeklyTasks = goal.tasks.filter((t) => t.type === TaskType.WEEKLY);
  const oneTimeTasks = goal.tasks.filter((t) => t.type === TaskType.ONE_TIME);

  const dailyDoneCount = dailyTasks.filter((t) => doneToday.has(t.id)).length;
  const weeklyDoneCount = weeklyTasks.filter((t) => doneWeek.has(t.id)).length;
  const oneTimeDoneCount = oneTimeTasks.filter((t) => doneOneTime.has(t.id)).length;

  const rewards = goal.rewards.map((r) => {
    if (r.type === RewardType.GOAL_COMPLETE) {
      return { id: r.id, title: r.title, achieved: goal.completedAt !== null, type: r.type };
    }

    const threshold = r.thresholdPoints ?? 0;
    return { id: r.id, title: `${r.title} (>= ${threshold} pts)`, achieved: totalPoints >= threshold, type: r.type };
  });

  const tasks = goal.tasks.map((t) => {
    const done = t.type === TaskType.DAILY 
      ? doneToday.has(t.id) 
      : t.type === TaskType.WEEKLY
      ? doneWeek.has(t.id)
      : doneOneTime.has(t.id);
    return { id: t.id, title: t.title, type: t.type, points: t.points, done };
  });

  return {
    id: goal.id,
    title: goal.title,
    assigneeName: goal.assignee.name,
    isCompleted: goal.completedAt !== null,
    startAt: goal.startAt,
    endAt: goal.endAt,
    daily: { done: dailyDoneCount, total: dailyTasks.length },
    weekly: { done: weeklyDoneCount, total: weeklyTasks.length },
    oneTime: { done: oneTimeDoneCount, total: oneTimeTasks.length },
    totalPoints,
    rewards,
    tasks,
  };
}

export default async function AdminPage() {
  const goals = await prisma.goal.findMany({ orderBy: { startAt: "desc" }, select: { id: true } });
  const goalViews = await Promise.all(goals.map((g) => buildGoalView(g.id)));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">概覽</h1>
        <p className="text-gray-600 dark:text-gray-400">管理和操作所有目標與任務</p>
      </div>

      <AdminGoalsClient goalViews={goalViews} completeTask={completeTask} completeGoal={completeGoal} />
    </AdminLayout>
  );
}
