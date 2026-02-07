"use client";

import { useState } from "react";
import GoalCard, { GoalSummary } from "@/app/components/GoalCard";

type Props = {
  summaries: GoalSummary[];
};

export default function UserGoalsClient({ summaries }: Props) {
  const [showExpired, setShowExpired] = useState(false);
  const now = new Date();
  
  // Sort by startAt descending (newer first)
  const sortedSummaries = [...summaries].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
  
  // Filter expired if showExpired is false
  const filteredSummaries = showExpired 
    ? sortedSummaries 
    : sortedSummaries.filter(s => new Date(s.endAt) >= now);
  
  const expiredCount = sortedSummaries.filter(s => new Date(s.endAt) < now).length;

  return (
    <>
      {expiredCount > 0 && (
        <div className="mb-6 flex justify-center">
          <button
            onClick={() => setShowExpired(!showExpired)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white border border-slate-600/50"
          >
            {showExpired ? "隱藏已過期目標" : `顯示已過期目標 (${expiredCount})`}
          </button>
        </div>
      )}
      
      {filteredSummaries.length === 0 ? (
        <div className="text-center py-32">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-cyan-500/20 blur-2xl"></div>
            <div className="relative bg-slate-900/50 backdrop-blur-xl rounded-3xl border-2 border-cyan-500/30 p-16 neon-border">
              <svg className="w-24 h-24 mx-auto mb-6 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <h2 className="text-2xl font-bold text-cyan-300 mb-4">
                {expiredCount > 0 ? "目前沒有進行中的目標" : "系統初始化中"}
              </h2>
              <p className="text-gray-400">
                {expiredCount > 0 ? "點擊上方按鈕查看已過期目標" : "尚無任務數據"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
          {filteredSummaries.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </>
  );
}
