"use client";

import { useState } from "react";
import { RewardType } from "@prisma/client";

type Goal = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  assignee: { name: string };
};

type Reward = {
  id: string;
  title: string;
  type: RewardType;
  thresholdPoints: number | null;
  goal: {
    id: string;
    title: string;
    assignee: { name: string };
  };
};

type Props = {
  goals: Goal[];
  rewards: Reward[];
  createPointReward: (formData: FormData) => Promise<void>;
  updateReward: (formData: FormData) => Promise<void>;
  deleteReward: (formData: FormData) => Promise<void>;
};

export default function RewardsPageClient({
  goals,
  rewards,
  createPointReward,
  updateReward,
  deleteReward,
}: Props) {
  const now = new Date();
  
  // Filter out expired goals for the dropdown
  const activeGoals = goals
    .filter(g => new Date(g.endAt) >= now)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  
  // Use a function to get initial value to ensure it's valid
  const getInitialGoalId = () => {
    return activeGoals[0]?.id ?? "";
  };
  
  const [selectedGoalId, setSelectedGoalId] = useState<string>(getInitialGoalId);
  
  // Check if selected goal is still valid, if not reset to first active goal
  const effectiveSelectedGoalId = activeGoals.some(g => g.id === selectedGoalId) 
    ? selectedGoalId 
    : (activeGoals[0]?.id ?? "");
  
  // Get rewards for the selected goal only
  const filteredRewards = rewards.filter(r => r.goal.id === effectiveSelectedGoalId);
  const pointRewards = filteredRewards.filter(r => r.type === RewardType.POINT_THRESHOLD);
  const goalRewards = filteredRewards.filter(r => r.type === RewardType.GOAL_COMPLETE);
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editThresholdPoints, setEditThresholdPoints] = useState("0");

  const handleSubmit = async (formData: FormData) => {
    await createPointReward(formData);
  };
  
  const handleGoalChange = (newGoalId: string) => {
    setSelectedGoalId(newGoalId);
  };

  const handleStartEdit = (reward: Reward) => {
    setEditingRewardId(reward.id);
    setEditTitle(reward.title);
    setEditThresholdPoints(String(reward.thresholdPoints ?? 0));
  };

  const handleCancelEdit = () => {
    setEditingRewardId(null);
    setEditTitle("");
    setEditThresholdPoints("0");
  };

  const handleUpdateReward = async (formData: FormData) => {
    await updateReward(formData);
    handleCancelEdit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Rewards List */}
      <div className="space-y-6">
        {/* Goal Filter */}
        {activeGoals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇目標以查看獎勵
            </label>
            <select 
              value={effectiveSelectedGoalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            >
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.assignee.name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Point Threshold Rewards */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">點數獎勵</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">達到特定點數時解鎖</p>
            </div>
          </div>
          
          {pointRewards.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>{selectedGoalId ? "此目標尚無點數獎勵" : "請先選擇一個目標"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pointRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border border-amber-200 dark:border-amber-800"
                >
                  {editingRewardId === reward.id ? (
                    <form action={handleUpdateReward} className="space-y-3">
                      <input type="hidden" name="rewardId" value={reward.id} />
                      <input type="hidden" name="type" value={reward.type} />
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">獎勵名稱</label>
                        <input
                          name="title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">門檻點數</label>
                        <input
                          name="thresholdPoints"
                          type="number"
                          min={0}
                          value={editThresholdPoints}
                          onChange={(e) => setEditThresholdPoints(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 text-sm rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          儲存
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h3>
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-full">
                          ≥ {reward.thresholdPoints} pts
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {reward.goal.title}
                        <span className="text-gray-400">·</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {reward.goal.assignee.name}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(reward)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
                        >
                          編輯
                        </button>
                        <form action={deleteReward}>
                          <input type="hidden" name="rewardId" value={reward.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!window.confirm("確定要刪除此獎勵嗎？")) {
                                e.preventDefault();
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/30"
                          >
                            刪除
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Goal Completion Rewards */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">完成獎勵</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">完成目標時獲得</p>
            </div>
          </div>
          
          {goalRewards.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500">
              <p>{selectedGoalId ? "此目標尚無完成獎勵" : "請先選擇一個目標"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {goalRewards.map((reward) => (
                <div
                  key={reward.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800"
                >
                  {editingRewardId === reward.id ? (
                    <form action={handleUpdateReward} className="space-y-3">
                      <input type="hidden" name="rewardId" value={reward.id} />
                      <input type="hidden" name="type" value={reward.type} />
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">獎勵名稱</label>
                        <input
                          name="title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-lg border border-green-300 dark:border-green-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white"
                        >
                          儲存
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{reward.title}</h3>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                          目標完成
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {reward.goal.title}
                        <span className="text-gray-400">·</span>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {reward.goal.assignee.name}
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(reward)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100/60 dark:hover:bg-green-900/30"
                        >
                          編輯
                        </button>
                        <form action={deleteReward}>
                          <input type="hidden" name="rewardId" value={reward.id} />
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!window.confirm("確定要刪除此獎勵嗎？")) {
                                e.preventDefault();
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/30"
                          >
                            刪除
                          </button>
                        </form>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 h-fit">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">建立點數獎勵</h2>
        
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="goalId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              選擇目標 <span className="text-red-500">*</span>
            </label>
            <select 
              id="goalId"
              name="goalId" 
              value={effectiveSelectedGoalId}
              onChange={(e) => handleGoalChange(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            >
              {activeGoals.length === 0 ? <option value="">(沒有可用的目標)</option> : null}
              {activeGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.assignee.name})
                </option>
              ))}
            </select>
            {goals.length > 0 && activeGoals.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">所有目標都已過期，請先建立新目標</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              獎勵名稱 <span className="text-red-500">*</span>
            </label>
            <input 
              id="title"
              name="title" 
              placeholder="例如：看一部電影"
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div>
            <label htmlFor="thresholdPoints" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              門檻點數 <span className="text-red-500">*</span>
            </label>
            <input 
              id="thresholdPoints"
              name="thresholdPoints" 
              type="number" 
              min={0} 
              defaultValue={10}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">達到此點數即可解鎖獎勵</p>
          </div>
          
          <button 
            type="submit" 
            disabled={activeGoals.length === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            建立獎勵
          </button>
        </form>

        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium mb-1">獎勵類型說明</p>
              <ul className="space-y-1 text-xs">
                <li><strong>點數獎勵：</strong>累積點數達到門檻即可獲得</li>
                <li><strong>完成獎勵：</strong>由建立目標時自動建立，完成整個目標時獲得</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
