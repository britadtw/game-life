import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { backfillTaskCompletion } from "../actions";
import { dayStartUtc, weeklyPeriodStartUtc } from "@/lib/period";
import { TaskType } from "@prisma/client";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

type SearchParams = Promise<{ goalId?: string; date?: string }>;

export default async function BackfillPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedGoalId = params.goalId ?? "";
  const selectedDateStr = params.date ?? formatDate(new Date());
  const selectedDate = new Date(selectedDateStr);

  // Fetch all goals with their tasks and assignees
  const goals = await prisma.goal.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      assignee: true,
      tasks: { 
        where: { isActive: true }, 
        orderBy: { createdAt: "asc" } 
      },
    },
  });

  // Find the selected goal
  const selectedGoal = selectedGoalId 
    ? goals.find(g => g.id === selectedGoalId) 
    : goals[0];

  // Get completions for the selected date/period
  const completions: Set<string> = new Set();
  let dailyPeriodStart: Date | null = null;
  let weeklyPeriodStart: Date | null = null;

  if (selectedGoal) {
    dailyPeriodStart = dayStartUtc(selectedDate);
    weeklyPeriodStart = weeklyPeriodStartUtc({ 
      now: selectedDate, 
      weeklyStartAt: selectedGoal.weeklyStartAt 
    });

    const completionRecords = await prisma.taskCompletion.findMany({
      where: {
        goalId: selectedGoal.id,
        periodStart: { in: [dailyPeriodStart, weeklyPeriodStart] },
      },
      select: { taskId: true, periodStart: true },
    });

    // Build a set of completed task IDs for the appropriate period
    for (const c of completionRecords) {
      const task = selectedGoal.tasks.find(t => t.id === c.taskId);
      if (task) {
        if (task.type === TaskType.DAILY && c.periodStart.getTime() === dailyPeriodStart.getTime()) {
          completions.add(c.taskId);
        } else if (task.type === TaskType.WEEKLY && c.periodStart.getTime() === weeklyPeriodStart.getTime()) {
          completions.add(c.taskId);
        }
      }
    }
  }

  const dailyTasks = selectedGoal?.tasks.filter(t => t.type === TaskType.DAILY) ?? [];
  const weeklyTasks = selectedGoal?.tasks.filter(t => t.type === TaskType.WEEKLY) ?? [];

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">補登任務</h1>
          <p className="text-gray-600 dark:text-gray-400">回頭填寫過去的每日或每週任務完成記錄</p>
        </div>

        {/* Selection Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <form method="GET" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                選擇目標
              </label>
              <select
                id="goalId"
                name="goalId"
                defaultValue={selectedGoal?.id ?? ""}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                {goals.length === 0 ? <option value="">(尚無目標)</option> : null}
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.assignee.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                選擇日期
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={selectedDateStr}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                查詢
              </button>
            </div>
          </form>

          {/* Quick Date Navigation */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">快捷日期：</span>
            {[-7, -6, -5, -4, -3, -2, -1, 0].map((offset) => {
              const d = addDays(new Date(), offset);
              const dateStr = formatDate(d);
              const isSelected = dateStr === selectedDateStr;
              return (
                <a
                  key={offset}
                  href={`/admin/backfill?goalId=${selectedGoal?.id ?? ""}&date=${dateStr}`}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {offset === 0 ? "今天" : offset === -1 ? "昨天" : `${-offset}天前`}
                </a>
              );
            })}
          </div>
        </div>

        {selectedGoal ? (
          <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-semibold mb-1">補登說明</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                    <li>每日任務：補登到選擇日期當天的週期</li>
                    <li>每週任務：補登到選擇日期所屬的週期（從週起點開始算）</li>
                    <li>週期起點：{formatDate(selectedGoal.weeklyStartAt)}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Daily Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">每日任務</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    日期：{selectedDateStr}
                  </p>
                </div>
              </div>

              {dailyTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <p>尚無每日任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyTasks.map((task) => {
                    const isCompleted = completions.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCompleted
                            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                            : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isCompleted 
                                ? "bg-green-500 text-white" 
                                : "bg-gray-200 dark:bg-gray-600 text-gray-400"
                            }`}>
                              {isCompleted ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{task.points} pts</span>
                            </div>
                          </div>
                          <form action={backfillTaskCompletion}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="date" value={selectedDateStr} />
                            <input type="hidden" name="action" value={isCompleted ? "uncomplete" : "complete"} />
                            <button
                              type="submit"
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                isCompleted
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                              }`}
                            >
                              {isCompleted ? "取消完成" : "標記完成"}
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly Tasks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">每週任務</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    週期：{weeklyPeriodStart ? formatDate(weeklyPeriodStart) : ""} 起
                  </p>
                </div>
              </div>

              {weeklyTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <p>尚無每週任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weeklyTasks.map((task) => {
                    const isCompleted = completions.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isCompleted
                            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                            : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isCompleted 
                                ? "bg-green-500 text-white" 
                                : "bg-gray-200 dark:bg-gray-600 text-gray-400"
                            }`}>
                              {isCompleted ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className="text-sm text-gray-500 dark:text-gray-400">{task.points} pts</span>
                            </div>
                          </div>
                          <form action={backfillTaskCompletion}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="date" value={selectedDateStr} />
                            <input type="hidden" name="action" value={isCompleted ? "uncomplete" : "complete"} />
                            <button
                              type="submit"
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                isCompleted
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                                  : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                              }`}
                            >
                              {isCompleted ? "取消完成" : "標記完成"}
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">尚無目標</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">請先建立目標才能補登任務</p>
            <Link
              href="/admin/goals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all"
            >
              前往建立目標
            </Link>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
