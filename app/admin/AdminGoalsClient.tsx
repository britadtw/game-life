"use client";

import { useState } from "react";
import { RewardType, TaskType } from "@prisma/client";

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

type Props = {
  goalViews: GoalView[];
  completeTask: (formData: FormData) => Promise<void>;
  completeGoal: (formData: FormData) => Promise<void>;
};

export default function AdminGoalsClient({ goalViews, completeTask, completeGoal }: Props) {
  const [showExpired, setShowExpired] = useState(false);
  const now = new Date();
  
  // Sort by startAt descending (newer first)
  const sortedGoals = [...goalViews].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
  
  // Filter expired if showExpired is false
  const filteredGoals = showExpired 
    ? sortedGoals 
    : sortedGoals.filter(g => new Date(g.endAt) >= now);
  
  const expiredCount = sortedGoals.filter(g => new Date(g.endAt) < now).length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">目標操作</h2>
        {expiredCount > 0 && (
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            {showExpired ? "隱藏已過期" : `顯示已過期 (${expiredCount})`}
          </button>
        )}
      </div>
      
      <div className="space-y-6">
        {filteredGoals.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            {expiredCount > 0 ? "目前沒有進行中的目標。點擊上方按鈕查看已過期目標。" : "尚無目標。前往目標管理頁面建立新目標。"}
          </div>
        ) : null}

        {filteredGoals.map((g) => {
          const isExpired = new Date(g.endAt) < now;
          return (
            <div 
              key={g.id} 
              className={`bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow ${isExpired ? 'opacity-60' : ''}`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{g.title}</h3>
                  {isExpired && (
                    <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium rounded">
                      已過期
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Assignee: <span className="font-medium">{g.assigneeName}</span> · Points: <span className="font-medium text-amber-600 dark:text-amber-400">{g.totalPoints}</span> · Daily <span className="font-medium">{g.daily.done}/{g.daily.total}</span> · Weekly <span className="font-medium">{g.weekly.done}/{g.weekly.total}</span> · OneTime <span className="font-medium">{g.oneTime.done}/{g.oneTime.total}</span>
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
                              : t.type === 'WEEKLY'
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
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
          );
        })}
      </div>
    </div>
  );
}
