"use client";

import { useState, useCallback } from "react";
import RewardProgressBar, { PointReward, GoalReward } from "./RewardProgressBar";
import ClaimRewardModal from "./ClaimRewardModal";
import { claimReward } from "@/app/actions";

type Task = {
  id: string;
  title: string;
  type: "DAILY" | "WEEKLY" | "ONE_TIME";
  points: number;
  done: boolean;
};

export type GoalSummary = {
  id: string;
  title: string;
  assigneeName: string;
  startAt: Date;
  endAt: Date;
  totalPoints: number;
  daily: { done: number; total: number };
  weekly: { done: number; total: number };
  oneTime: { done: number; total: number };
  tasks: Task[];
  pointRewards: PointReward[];
  goalRewards: GoalReward[];
};

export default function GoalCard({ goal }: { goal: GoalSummary }) {
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "oneTime">("daily");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<{ id: string; title: string } | null>(null);

  // 計算剩餘天數
  const now = new Date();
  const endDate = new Date(goal.endAt);
  const startDate = new Date(goal.startAt);
  const diffTime = endDate.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = remainingDays < 0;
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressDays = Math.max(0, Math.min(totalDays, totalDays - remainingDays));

  const filteredTasks = goal.tasks.filter((t) => 
    activeTab === "daily" ? t.type === "DAILY" : 
    activeTab === "weekly" ? t.type === "WEEKLY" :
    t.type === "ONE_TIME"
  );

  const dailyProgress = goal.daily.total > 0 
    ? Math.round((goal.daily.done / goal.daily.total) * 100) 
    : 0;
  const weeklyProgress = goal.weekly.total > 0 
    ? Math.round((goal.weekly.done / goal.weekly.total) * 100) 
    : 0;
  const oneTimeProgress = goal.oneTime.total > 0 
    ? Math.round((goal.oneTime.done / goal.oneTime.total) * 100) 
    : 0;

  const handleClaimReward = useCallback((rewardId: string, title: string) => {
    setSelectedReward({ id: rewardId, title });
    setModalOpen(true);
  }, []);

  const handleConfirmClaim = async () => {
    if (!selectedReward) return;
    const result = await claimReward(selectedReward.id);
    if (!result.success) {
      console.error(result.message);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedReward(null);
  };

  const hasRewards = goal.pointRewards.length > 0 || goal.goalRewards.length > 0;

  return (
    <>
      <article className="group relative h-full">
        {/* 卡片光暈效果 */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl opacity-30 group-hover:opacity-60 blur transition duration-300"></div>
        
        <div className="relative h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-cyan-500/30 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
          {/* 卡片內部網格背景 */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>

          {/* 1. Header Section - Goal Title + Assignee */}
          <header className="relative px-6 sm:px-8 py-5 sm:py-6 border-b border-cyan-500/20 bg-slate-900/50">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 truncate flex-1">
                {goal.title}
              </h2>
              <div className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30">
                <span className="text-xs sm:text-sm font-semibold text-purple-300 whitespace-nowrap">
                  {goal.assigneeName}
                </span>
              </div>
            </div>
          </header>

          {/* 2. Time + 3. Total Score Section */}
          <div className="relative px-6 sm:px-8 py-4 border-b border-cyan-500/20 bg-slate-900/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Time Info */}
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-400">
                  {startDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })} - {endDate.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                  isExpired 
                    ? 'bg-red-500/20 text-red-400' 
                    : remainingDays <= 7 
                      ? 'bg-orange-500/20 text-orange-400' 
                      : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {isExpired ? '已結束' : `剩餘 ${remainingDays} 天`}
                </span>
              </div>
              
              {/* Total Points */}
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-2xl sm:text-3xl font-black text-yellow-300 neon-text">
                  {goal.totalPoints}
                </span>
                <span className="text-xs text-gray-500">pts</span>
              </div>
            </div>
          </div>

          {/* 4. Rewards Section */}
          {hasRewards && (
            <div className="relative px-6 sm:px-8 py-4 border-b border-cyan-500/20 bg-slate-900/40">
              <RewardProgressBar
                currentPoints={goal.totalPoints}
                pointRewards={goal.pointRewards}
                goalRewards={goal.goalRewards}
                onClaimReward={handleClaimReward}
              />
            </div>
          )}

          {/* 5. Task Tabs */}
          <div className="relative flex border-b border-cyan-500/20 bg-slate-900/30">
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold transition-all duration-300 relative ${
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
                <span className={`text-xs sm:text-sm px-2 py-0.5 rounded-lg ${
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
              className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold transition-all duration-300 relative ${
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
                <span className={`text-xs sm:text-sm px-2 py-0.5 rounded-lg ${
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

            <button
              onClick={() => setActiveTab("oneTime")}
              className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base font-bold transition-all duration-300 relative ${
                activeTab === "oneTime"
                  ? "text-amber-300"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {activeTab === "oneTime" && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/50"></div>
              )}
              <div className="flex items-center justify-center gap-2">
                <span>單次任務</span>
                <span className={`text-xs sm:text-sm px-2 py-0.5 rounded-lg ${
                  activeTab === "oneTime" 
                    ? "bg-amber-500/20 text-amber-300" 
                    : "bg-gray-700/50 text-gray-400"
                }`}>
                  {goal.oneTime.done}/{goal.oneTime.total}
                </span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 shadow-lg shadow-amber-500/50"
                    style={{ width: `${oneTimeProgress}%` }}
                  />
                </div>
              </div>
            </button>
          </div>

          {/* 5. Tasks List */}
          <div className="relative flex-1 overflow-y-auto px-6 sm:px-8 py-4 sm:py-6">
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 sm:py-12 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-700/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">尚無任務</p>
              </div>
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                {filteredTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${
                      task.done
                        ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
                        : "bg-slate-800/40 border-slate-700/50 hover:border-cyan-500/30"
                    }`}
                  >
                    {/* 完成狀態圖示 */}
                    <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center ${
                      task.done 
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/50" 
                        : "bg-slate-700/50 border-2 border-slate-600"
                    }`}>
                      {task.done && (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* 任務標題 */}
                    <span className={`flex-1 text-sm sm:text-base font-medium break-words ${
                      task.done ? "text-emerald-300" : "text-gray-200"
                    }`}>
                      {task.title}
                    </span>

                    {/* 積分顯示 */}
                    <div className={`flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap ${
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
        </div>
      </article>

      {/* Claim Reward Modal */}
      <ClaimRewardModal
        isOpen={modalOpen}
        rewardTitle={selectedReward?.title ?? ""}
        onClose={handleCloseModal}
        onConfirm={handleConfirmClaim}
      />
    </>
  );
}
