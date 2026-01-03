import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createGoal } from "../actions";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
  const goals = await prisma.goal.findMany({ 
    orderBy: { createdAt: "desc" },
    include: { 
      assignee: true,
      _count: {
        select: {
          tasks: { where: { isActive: true } },
          rewards: true,
        }
      }
    } 
  });

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">目標管理</h1>
          <p className="text-gray-600 dark:text-gray-400">建立和管理所有目標</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-6">
          {/* Goals List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">所有目標</h2>
            
            {goals.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <p>尚無目標</p>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`p-5 rounded-xl border-2 transition-all ${
                      goal.completedAt
                        ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700"
                        : "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 border-indigo-200 dark:border-indigo-800 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                          {goal.completedAt && "✓ "}
                          {goal.title}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {goal.assignee.name}
                        </div>
                      </div>
                      {goal.completedAt && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                          已完成
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">任務</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{goal._count.tasks}</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">獎勵</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{goal._count.rewards}</div>
                      </div>
                      <div className="text-center p-3 bg-white/60 dark:bg-gray-700/30 rounded-lg">
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">狀態</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{goal.completedAt ? "✓" : "進行中"}</div>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>開始: {new Date(goal.startAt).toLocaleDateString("zh-TW")}</div>
                      <div>結束: {new Date(goal.endAt).toLocaleDateString("zh-TW")}</div>
                      <div>每週起始: {new Date(goal.weeklyStartAt).toLocaleDateString("zh-TW")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">建立新目標</h2>
            
            <form action={createGoal} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  目標名稱 <span className="text-red-500">*</span>
                </label>
                <input 
                  id="title"
                  name="title" 
                  placeholder="例如：學習 TypeScript" 
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  指派給 <span className="text-red-500">*</span>
                </label>
                <select 
                  id="assigneeId"
                  name="assigneeId" 
                  defaultValue={people[0]?.id ?? ""}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                >
                  {people.length === 0 ? <option value="">(請先建立人員)</option> : null}
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="startAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    開始日期 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="startAt"
                    name="startAt" 
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="weeklyStartAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    每週起始日 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="weeklyStartAt"
                    name="weeklyStartAt" 
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">每週任務以此日為週期重置</p>
                </div>

                <div>
                  <label htmlFor="endAt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    結束日期 <span className="text-red-500">*</span>
                  </label>
                  <input 
                    id="endAt"
                    name="endAt" 
                    type="date"
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  />
                  <p className="text-xs text-red-500 mt-1">⚠️ 必須是每週起始日的 7 天倍數</p>
                </div>
              </div>

              <div>
                <label htmlFor="completeRewardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  完成獎勵 <span className="text-red-500">*</span>
                </label>
                <input 
                  id="completeRewardTitle"
                  name="completeRewardTitle" 
                  placeholder="例如：獲得新書一本"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">完成整個目標時獲得的獎勵</p>
              </div>
              
              <button 
                type="submit" 
                disabled={people.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                建立目標
              </button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
