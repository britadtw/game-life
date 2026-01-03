import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createTask } from "../actions";
import { TaskType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const goals = await prisma.goal.findMany({ 
    orderBy: { createdAt: "desc" },
    include: { assignee: true }
  });
  
  const tasks = await prisma.task.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    include: { goal: { include: { assignee: true } } }
  });

  const dailyTasks = tasks.filter(t => t.type === TaskType.DAILY);
  const weeklyTasks = tasks.filter(t => t.type === TaskType.WEEKLY);

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">任務管理</h1>
          <p className="text-gray-600 dark:text-gray-400">建立和管理每日與每週任務</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Tasks List */}
          <div className="space-y-6">
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">每天重置</p>
                </div>
              </div>
              
              {dailyTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <p>尚無每日任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                          {task.points} pts
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {task.goal.title}
                        <span className="text-gray-400">·</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {task.goal.assignee.name}
                      </div>
                    </div>
                  ))}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">每 7 天重置</p>
                </div>
              </div>
              
              {weeklyTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                  <p>尚無每週任務</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weeklyTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                        <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                          {task.points} pts
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {task.goal.title}
                        <span className="text-gray-400">·</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {task.goal.assignee.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">建立新任務</h2>
            
            <form action={createTask} className="space-y-4">
              <div>
                <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  選擇目標 <span className="text-red-500">*</span>
                </label>
                <select 
                  id="goalId"
                  name="goalId" 
                  defaultValue={goals[0]?.id ?? ""}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  {goals.length === 0 ? <option value="">(請先建立目標)</option> : null}
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.assignee.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任務名稱 <span className="text-red-500">*</span>
                </label>
                <input 
                  id="title"
                  name="title" 
                  placeholder="例如：閱讀 30 分鐘"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  任務類型 <span className="text-red-500">*</span>
                </label>
                <select 
                  id="type"
                  name="type" 
                  defaultValue="DAILY"
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="DAILY">每日任務 (每天重置)</option>
                  <option value="WEEKLY">每週任務 (7 天重置)</option>
                </select>
              </div>

              <div>
                <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  獎勵點數 <span className="text-red-500">*</span>
                </label>
                <input 
                  id="points"
                  name="points" 
                  type="number" 
                  min={0} 
                  defaultValue={1}
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">完成任務可獲得的點數</p>
              </div>
              
              <button 
                type="submit" 
                disabled={goals.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                建立任務
              </button>
            </form>

            <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-indigo-900 dark:text-indigo-200">
                  <p className="font-medium mb-1">任務類型說明</p>
                  <ul className="space-y-1 text-xs">
                    <li><strong>每日：</strong>每天午夜重置</li>
                    <li><strong>每週：</strong>根據目標的每週起始日重置</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
