import { prisma } from "@/lib/prisma";
import AdminLayout from "../../components/AdminLayout";
import { createPerson } from "../actions";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { goals: true } } } });

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">人員管理</h1>
          <p className="text-gray-600 dark:text-gray-400">管理參與目標的所有人員</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* People List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">所有人員</h2>
            
            {people.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p>尚無人員</p>
              </div>
            ) : (
              <div className="space-y-3">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {person.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{person.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {person._count.goals} 個目標
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(person.createdAt).toLocaleDateString("zh-TW")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">新增人員</h2>
            
            <form action={createPerson} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  姓名
                </label>
                <input 
                  id="name"
                  name="name" 
                  placeholder="輸入姓名" 
                  required
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                新增人員
              </button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-900 dark:text-blue-200">
                  <p className="font-medium mb-1">提示</p>
                  <p>建立人員後，才能為他們設定目標。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
