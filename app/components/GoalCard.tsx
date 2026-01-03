"use client";

import { useState } from "react";

type Task = {
  id: string;
  title: string;
  type: "DAILY" | "WEEKLY";
  points: number;
  done: boolean;
};

type GoalSummary = {
  id: string;
  title: string;
  assigneeName: string;
  totalPoints: number;
  daily: { done: number; total: number };
  weekly: { done: number; total: number };
  tasks: Task[];
  rewards: Array<{ id: string; label: string; achieved: boolean }>;
};

export default function GoalCard({ goal }: { goal: GoalSummary }) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly">("daily");

  const filteredTasks = goal.tasks.filter((t) => 
    t.type === (activeTab === "daily" ? "DAILY" : "WEEKLY")
  );

  const dailyProgress = goal.daily.total > 0 
    ? Math.round((goal.daily.done / goal.daily.total) * 100) 
    : 0;
  const weeklyProgress = goal.weekly.total > 0 
    ? Math.round((goal.weekly.done / goal.weekly.total) * 100) 
    : 0;

  return (
    <article className="group relative h-full">
      {/* 卡片光暈效果 */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-60 blur transition duration-300"></div>
      
      <div className="relative h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-cyan-500/30 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
        {/* 卡片內部網格背景 */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>

        {/* Header Section */}
        <header className="relative px-8 py-7 border-b border-cyan-500/20 bg-slate-900/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 truncate flex-1 mr-4">
              {goal.title}
            </h2>
            <div className="flex-shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
              <span className="text-sm font-semibold text-purple-300 whitespace-nowrap">
                {goal.assigneeName}
              </span>
            </div>
          </div>
          
          {/* Total Points Display */}
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">總積分</p>
              <p className="text-3xl font-black text-yellow-300 neon-text">
                {goal.totalPoints}
              </p>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="relative flex border-b border-cyan-500/20 bg-slate-900/30">
          <button
            onClick={() => setActiveTab("daily")}
            className={`flex-1 py-4 px-6 text-base font-bold transition-all duration-300 relative ${
              activeTab === "daily"
                ? "text-cyan-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {activeTab === "daily" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50"></div>
            )}
            <div className="flex items-center justify-center gap-2">
              <span>每日任務</span>
              <span className={`text-sm px-2.5 py-1 rounded-lg ${
                activeTab === "daily" 
                  ? "bg-cyan-500/20 text-cyan-300" 
                  : "bg-gray-700/50 text-gray-400"
              }`}>
                {goal.daily.done}/{goal.daily.total}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 shadow-lg shadow-cyan-500/50"
                  style={{ width: `${dailyProgress}%` }}
                />
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("weekly")}
            className={`flex-1 py-4 px-6 text-base font-bold transition-all duration-300 relative ${
              activeTab === "weekly"
                ? "text-purple-300"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {activeTab === "weekly" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50"></div>
            )}
            <div className="flex items-center justify-center gap-2">
              <span>每週任務</span>
              <span className={`text-sm px-2.5 py-1 rounded-lg ${
                activeTab === "weekly" 
                  ? "bg-purple-500/20 text-purple-300" 
                  : "bg-gray-700/50 text-gray-400"
              }`}>
                {goal.weekly.done}/{goal.weekly.total}
              </span>
            </div>
            <div className="mt-2">
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 shadow-lg shadow-purple-500/50"
                  style={{ width: `${weeklyProgress}%` }}
                />
              </div>
            </div>
          </button>
        </div>

        {/* Tasks List */}
        <div className="relative flex-1 overflow-y-auto px-8 py-6">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">尚無任務</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                    task.done
                      ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
                      : "bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/30"
                  }`}
                >
                  {/* 完成狀態圖示 */}
                  <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                    task.done 
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/50" 
                      : "bg-slate-700/50 border-2 border-slate-600"
                  }`}>
                    {task.done && (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* 任務標題 */}
                  <span className={`flex-1 text-base font-medium break-words ${
                    task.done ? "text-emerald-300" : "text-gray-200"
                  }`}>
                    {task.title}
                  </span>

                  {/* 積分顯示 */}
                  <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-sm whitespace-nowrap ${
                    task.done
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-yellow-500/20 text-yellow-300"
                  }`}>
                    +{task.points}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Rewards Section */}
        {goal.rewards.length > 0 && (
          <div className="relative px-8 py-6 border-t border-cyan-500/20 bg-slate-900/50">
            <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              獎勵解鎖
            </h3>
            <ul className="space-y-4">
              {goal.rewards.map((reward) => {
                const match = reward.label.match(/\(>= (\d+) pts\)/);
                const threshold = match ? parseInt(match[1], 10) : null;
                const progress = threshold !== null 
                  ? Math.min(Math.round((goal.totalPoints / threshold) * 100), 100) 
                  : (reward.achieved ? 100 : 0);

                return (
                  <li key={reward.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-base font-medium break-words flex-1 mr-4 ${
                        reward.achieved ? "text-yellow-300" : "text-gray-400"
                      }`}>
                        {reward.label}
                      </span>
                      <span className={`text-sm font-bold whitespace-nowrap ${
                        reward.achieved ? "text-emerald-300" : "text-gray-500"
                      }`}>
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          reward.achieved 
                            ? "bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/50" 
                            : "bg-gradient-to-r from-gray-600 to-gray-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
