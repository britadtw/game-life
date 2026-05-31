"use client";

import { useState } from "react";
import { deleteGoal, updateGoal } from "../actions";

function toDateInputValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

type Goal = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  weeklyStartAt: Date;
  completedAt: Date | null;
  assigneeId: string;
  assignee: { id: string; name: string };
  _count: {
    tasks: number;
    rewards: number;
  };
};

type Person = {
  id: string;
  name: string;
};

type Props = {
  goals: Goal[];
  people: Person[];
};

export default function GoalsListClient({ goals, people }: Props) {
  const [showExpired, setShowExpired] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const now = new Date();
  
  // Sort by startAt descending (newer first)
  const sortedGoals = [...goals].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
  
  // Filter expired if showExpired is false
  const filteredGoals = showExpired 
    ? sortedGoals 
    : sortedGoals.filter(g => new Date(g.endAt) >= now);
  
  const expiredCount = sortedGoals.filter(g => new Date(g.endAt) < now).length;

  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-gray-500">
        <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
        <p>尚無目標</p>
      </div>
    );
  }

  return (
    <>
      {expiredCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
          >
            {showExpired ? "隱藏已過期" : `顯示已過期 (${expiredCount})`}
          </button>
        </div>
      )}
      
      {filteredGoals.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p>目前沒有進行中的目標</p>
          <p className="text-sm mt-2">點擊上方按鈕查看已過期目標</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGoals.map((goal) => {
            const isExpired = new Date(goal.endAt) < now;
            const isEditing = editingGoalId === goal.id;
            return (
              <div
                key={goal.id}
                className={`p-5 rounded-xl border-2 transition-all ${
                  goal.completedAt
                    ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-700"
                    : isExpired
                    ? "bg-gray-50 dark:bg-gray-900/10 border-gray-300 dark:border-gray-700 opacity-60"
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
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGoalId(isEditing ? null : goal.id)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {isEditing ? "取消編輯" : "編輯"}
                    </button>
                    <form
                      action={deleteGoal}
                      onSubmit={(event) => {
                        if (!confirm("確定要刪除此目標？將會一併刪除任務與獎勵。")) {
                          event.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="goalId" value={goal.id} />
                      <button
                        type="submit"
                        className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                        刪除
                      </button>
                    </form>
                    {isExpired && !goal.completedAt && (
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold rounded-full">
                        已過期
                      </span>
                    )}
                    {goal.completedAt && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                        已完成
                      </span>
                    )}
                  </div>
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
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {goal.completedAt ? "✓" : isExpired ? "已過期" : "進行中"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <div>開始: {new Date(goal.startAt).toLocaleDateString("zh-TW")}</div>
                  <div>結束: {new Date(goal.endAt).toLocaleDateString("zh-TW")}</div>
                  <div>每週起始: {new Date(goal.weeklyStartAt).toLocaleDateString("zh-TW")}</div>
                </div>

                {isEditing && (
                  <form action={updateGoal} className="mt-4 p-4 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-3">
                    <input type="hidden" name="goalId" value={goal.id} />

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">目標名稱</label>
                      <input
                        name="title"
                        defaultValue={goal.title}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">指派給</label>
                      <select
                        name="assigneeId"
                        defaultValue={goal.assigneeId}
                        required
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                      >
                        {people.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">開始日期</label>
                        <input
                          name="startAt"
                          type="date"
                          defaultValue={toDateInputValue(goal.startAt)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">每週起始日</label>
                        <input
                          name="weeklyStartAt"
                          type="date"
                          defaultValue={toDateInputValue(goal.weeklyStartAt)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">結束日期</label>
                        <input
                          name="endAt"
                          type="date"
                          defaultValue={toDateInputValue(goal.endAt)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingGoalId(null)}
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        儲存
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
