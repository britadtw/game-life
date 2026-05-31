import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createGoal } from "../actions";
import GoalsListClient from "./GoalsListClient";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" } });
  const goals = await prisma.goal.findMany({ 
    orderBy: { startAt: "desc" },
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
            <GoalsListClient goals={goals} />
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
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">結束日用來決定目標何時過期；每週任務仍會依每週起始日計算</p>
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
