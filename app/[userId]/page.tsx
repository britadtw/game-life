import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { RewardType, TaskType } from "@prisma/client";
import GoalCard, { GoalSummary } from "@/app/components/GoalCard";
import { PointReward, GoalReward } from "@/app/components/RewardProgressBar";

export const dynamic = "force-dynamic";

type Task = {
  id: string;
  title: string;
  type: "DAILY" | "WEEKLY";
  points: number;
  done: boolean;
};

async function buildGoalSummary(goalId: string): Promise<GoalSummary> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      assignee: true,
      tasks: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      rewards: { 
        orderBy: { createdAt: "asc" },
        include: { claims: true }
      },
    },
  });

  if (!goal) {
    throw new Error("Goal not found");
  }

  const now = new Date();
  const todayStart = dayStartUtc(now);
  const weekStart = weeklyPeriodStartUtc({ now, weeklyStartAt: goal.weeklyStartAt });

  const completions = await prisma.taskCompletion.findMany({
    where: {
      goalId: goal.id,
      periodStart: { in: [todayStart, weekStart] },
    },
    select: { taskId: true, periodStart: true },
  });

  const doneToday = new Set(
    completions.filter((c) => c.periodStart.getTime() === todayStart.getTime()).map((c) => c.taskId),
  );
  const doneWeek = new Set(
    completions.filter((c) => c.periodStart.getTime() === weekStart.getTime()).map((c) => c.taskId),
  );

  const totalPointsAgg = await prisma.taskCompletion.aggregate({
    where: { goalId: goal.id },
    _sum: { pointsAwarded: true },
  });
  const totalPoints = totalPointsAgg._sum.pointsAwarded ?? 0;

  const dailyTasks = goal.tasks.filter((t) => t.type === TaskType.DAILY);
  const weeklyTasks = goal.tasks.filter((t) => t.type === TaskType.WEEKLY);

  const dailyDoneCount = dailyTasks.filter((t) => doneToday.has(t.id)).length;
  const weeklyDoneCount = weeklyTasks.filter((t) => doneWeek.has(t.id)).length;

  // Separate rewards by type
  const pointRewards: PointReward[] = goal.rewards
    .filter((r) => r.type === RewardType.POINT_THRESHOLD)
    .map((r) => ({
      id: r.id,
      title: r.title,
      thresholdPoints: r.thresholdPoints ?? 0,
      achieved: totalPoints >= (r.thresholdPoints ?? 0),
      claimed: r.claims.length > 0,
    }));

  const goalRewards: GoalReward[] = goal.rewards
    .filter((r) => r.type === RewardType.GOAL_COMPLETE)
    .map((r) => ({
      id: r.id,
      title: r.title,
      achieved: goal.completedAt !== null,
      claimed: r.claims.length > 0,
    }));

  const tasks: Task[] = goal.tasks.map((t) => {
    const done = t.type === TaskType.DAILY ? doneToday.has(t.id) : doneWeek.has(t.id);
    return {
      id: t.id,
      title: t.title,
      type: t.type,
      points: t.points,
      done,
    };
  });

  return {
    id: goal.id,
    title: goal.title,
    assigneeName: goal.assignee.name,
    startAt: goal.startAt,
    endAt: goal.endAt,
    totalPoints,
    daily: { done: dailyDoneCount, total: dailyTasks.length },
    weekly: { done: weeklyDoneCount, total: weeklyTasks.length },
    tasks,
    pointRewards,
    goalRewards,
  };
}

export default async function UserGoalsPage({ params }: { params: Promise<{ userId: string }> }) {
  // Next.js 15: params 是 Promise，需要 await
  const { userId } = await params;
  
  // 查找用戶
  const person = await prisma.person.findUnique({
    where: { id: userId },
  });

  if (!person) {
    notFound();
  }

  // 獲取該用戶的所有目標
  const goals = await prisma.goal.findMany({
    where: { assigneeId: userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const summaries = await Promise.all(goals.map((g) => buildGoalSummary(g.id)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 cyber-grid relative overflow-hidden">
      {/* 科技風格背景效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 sm:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-6xl sm:text-7xl font-black mb-4 neon-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
            GAME LIFE
          </h1>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
            <p className="text-cyan-300 text-xl font-semibold tracking-wider uppercase">
              {person.name}
            </p>
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          </div>
          <p className="text-gray-400 text-base tracking-wide">
            完成任務 · 獲得獎勵 · 升級人生
          </p>
        </header>

        {/* Main Content */}
        <main>
          {summaries.length === 0 ? (
            <div className="text-center py-32">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/20 blur-2xl"></div>
                <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/30 p-16 neon-border">
                  <svg className="w-24 h-24 mx-auto mb-6 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-cyan-300 mb-4">系統初始化中</h2>
                  <p className="text-gray-400">
                    尚無任務數據
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
              {summaries.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
