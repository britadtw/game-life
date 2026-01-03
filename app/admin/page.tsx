import { prisma } from "@/lib/prisma";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { RewardType, TaskType } from "@prisma/client";
import AdminLayout from "../components/AdminLayout";
import { completeGoal, completeTask } from "./actions";

export const dynamic = "force-dynamic";

type GoalView = {
  id: string;
  title: string;
  assigneeName: string;
  isCompleted: boolean;
  daily: { done: number; total: number };
  weekly: { done: number; total: number };
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

  const rewards = goal.rewards.map((r) => {
    if (r.type === RewardType.GOAL_COMPLETE) {
      return { id: r.id, title: r.title, achieved: goal.completedAt !== null, type: r.type };
    }

    const threshold = r.thresholdPoints ?? 0;
    return { id: r.id, title: `${r.title} (>= ${threshold} pts)`, achieved: totalPoints >= threshold, type: r.type };
  });

  const tasks = goal.tasks.map((t) => {
    const done = t.type === TaskType.DAILY ? doneToday.has(t.id) : doneWeek.has(t.id);
    return { id: t.id, title: t.title, type: t.type, points: t.points, done };
  });

  return {
    id: goal.id,
    title: goal.title,
    assigneeName: goal.assignee.name,
    isCompleted: goal.completedAt !== null,
    daily: { done: dailyDoneCount, total: dailyTasks.length },
    weekly: { done: weeklyDoneCount, total: weeklyTasks.length },
    totalPoints,
    rewards,
    tasks,
  };
}

export default async function AdminPage() {
  const goals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" }, select: { id: true } });
  const goalViews = await Promise.all(goals.map((g) => buildGoalView(g.id)));

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">概覽</h1>
        <p className="text-gray-600 dark:text-gray-400">管理和操作所有目標與任務</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">目標操作</h2>
        <div className="space-y-6">
          {goalViews.length === 0 ? <div className="text-gray-500 dark:text-gray-400 text-sm">尚無目標。前往目標管理頁面建立新目標。</div> : null}

              {goalViews.map((g) => (
                <div key={g.id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{g.title}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Assignee: <span className="font-medium">{g.assigneeName}</span> · Points: <span className="font-medium text-amber-600 dark:text-amber-400">{g.totalPoints}</span> · Daily <span className="font-medium">{g.daily.done}/{g.daily.total}</span> · Weekly <span className="font-medium">{g.weekly.done}/{g.weekly.total}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">獎勵</div>
                    <div className="flex flex-wrap gap-2">
                      {g.rewards.map((r) => (
                        <span 
                          key={r.id} 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            r.achieved 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {r.achieved ? "✓" : "·"} {r.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">任務</div>
                    <div className="space-y-3">
                      {g.tasks.length === 0 ? <div className="text-xs text-gray-500 dark:text-gray-400">尚無任務。</div> : null}
                      {g.tasks.map((t) => (
                        <div key={t.id} className="flex items-center justify-between gap-4 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white truncate">{t.title}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                t.type === 'DAILY' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              }`}>
                                {t.type}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t.points} pts</div>
                          </div>

                          <form action={completeTask}>
                            <input type="hidden" name="taskId" value={t.id} />
                            <button 
                              type="submit" 
                              disabled={t.done}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                                t.done
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md'
                              }`}
                            >
                              {t.done ? "✓ 已完成" : "完成"}
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                    <form action={completeGoal}>
                      <input type="hidden" name="goalId" value={g.id} />
                      <button 
                        type="submit" 
                        disabled={g.isCompleted}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                          g.isCompleted
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        {g.isCompleted ? "✓ 目標已完成" : "完成目標"}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          </div>
    </AdminLayout>
  );
}
