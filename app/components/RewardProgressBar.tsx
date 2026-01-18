"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export type PointReward = {
  id: string;
  title: string;
  thresholdPoints: number;
  achieved: boolean;
  claimed: boolean;
};

export type GoalReward = {
  id: string;
  title: string;
  achieved: boolean;
  claimed: boolean;
};

type RewardProgressBarProps = {
  currentPoints: number;
  pointRewards: PointReward[];
  goalRewards: GoalReward[];
  onClaimReward: (rewardId: string, title: string) => void;
};

export default function RewardProgressBar({
  currentPoints,
  pointRewards,
  goalRewards,
  onClaimReward,
}: RewardProgressBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sort rewards by threshold points
  const sortedRewards = [...pointRewards].sort((a, b) => a.thresholdPoints - b.thresholdPoints);
  
  // Calculate max points
  const maxThreshold = sortedRewards.length > 0 
    ? sortedRewards[sortedRewards.length - 1].thresholdPoints 
    : 100;
  
  // Calculate progress percentage
  const progressPercentage = Math.min((currentPoints / maxThreshold) * 100, 100);

  // Check scroll state
  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-cyan-300 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            獎勵進度
          </h3>
          <span className="text-sm font-semibold text-yellow-300">
            {currentPoints} / {maxThreshold} pts
          </span>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full shadow-lg shadow-cyan-500/50"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          {/* Progress indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-cyan-400"
            initial={{ left: 0 }}
            animate={{ left: `calc(${progressPercentage}% - 8px)` }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ left: `calc(${Math.max(0, Math.min(progressPercentage, 100))}% - 8px)` }}
          />
        </div>
      </div>

      {/* Rewards Section - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Point Rewards */}
        {sortedRewards.length > 0 && (
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              積分獎勵
            </h4>
            
            <div className="relative">
              {/* Left scroll button */}
              {canScrollLeft && (
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-slate-800/90 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 hover:bg-slate-700 transition-all shadow-lg"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Right scroll button */}
              {canScrollRight && (
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-slate-800/90 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 hover:bg-slate-700 transition-all shadow-lg"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Scrollable container */}
              <div 
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
              >
                <div className="flex gap-2 min-w-max">
                  {sortedRewards.map((reward) => {
                    const isUnlocked = reward.achieved;
                    const isClaimed = reward.claimed;
                    const progress = Math.min((currentPoints / reward.thresholdPoints) * 100, 100);
                    
                    return (
                      <motion.button
                        key={reward.id}
                        onClick={() => isUnlocked && !isClaimed && onClaimReward(reward.id, reward.title)}
                        disabled={!isUnlocked || isClaimed}
                        className={`relative flex-shrink-0 w-24 sm:w-28 p-2.5 rounded-xl border-2 transition-all ${
                          isClaimed
                            ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/50"
                            : isUnlocked
                            ? "bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-500/50 cursor-pointer"
                            : "bg-slate-800/50 border-slate-600/50"
                        }`}
                        whileHover={isUnlocked && !isClaimed ? { scale: 1.05, y: -2 } : {}}
                        whileTap={isUnlocked && !isClaimed ? { scale: 0.98 } : {}}
                      >
                        {/* Status Icon */}
                        <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                          isClaimed
                            ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/30"
                            : isUnlocked
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500 shadow-md shadow-yellow-500/30 animate-pulse"
                            : "bg-slate-700"
                        }`}>
                          {isClaimed ? (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isUnlocked ? (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </div>

                        {/* Title */}
                        <div className={`text-xs font-semibold text-center truncate mb-0.5 ${
                          isClaimed ? "text-emerald-300" : isUnlocked ? "text-yellow-300" : "text-gray-400"
                        }`}>
                          {reward.title}
                        </div>

                        {/* Points */}
                        <div className="text-[10px] text-center text-gray-500 mb-1.5">
                          {reward.thresholdPoints} pts
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              isClaimed
                                ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                                : isUnlocked
                                ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                                : "bg-gradient-to-r from-cyan-500 to-blue-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>

                        {/* Action hint */}
                        {isUnlocked && !isClaimed && (
                          <div className="text-[9px] text-yellow-200 text-center mt-1 font-medium">
                            點擊領取
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        {sortedRewards.length > 0 && goalRewards.length > 0 && (
          <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />
        )}

        {/* Right: Goal Completion Rewards */}
        {goalRewards.length > 0 && (
          <div className={`${sortedRewards.length > 0 ? 'lg:w-48 flex-shrink-0' : 'flex-1'}`}>
            <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              目標完成獎勵
            </h4>
            
            {/* Mobile: horizontal scroll, Desktop: vertical stack */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible scrollbar-hide pb-1 lg:pb-0">
              {goalRewards.map((reward) => (
                <motion.button
                  key={reward.id}
                  onClick={() => reward.achieved && !reward.claimed && onClaimReward(reward.id, reward.title)}
                  disabled={!reward.achieved || reward.claimed}
                  className={`flex-shrink-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all min-w-[160px] lg:min-w-0 lg:w-full ${
                    reward.claimed
                      ? "bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-emerald-500/40"
                      : reward.achieved
                      ? "bg-gradient-to-r from-purple-500/15 to-pink-500/15 border-purple-500/40 cursor-pointer"
                      : "bg-slate-800/40 border-slate-700/50 opacity-60"
                  }`}
                  whileHover={reward.achieved && !reward.claimed ? { scale: 1.02 } : {}}
                  whileTap={reward.achieved && !reward.claimed ? { scale: 0.98 } : {}}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    reward.claimed
                      ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                      : reward.achieved
                      ? "bg-gradient-to-br from-purple-400 to-pink-500 shadow-lg shadow-purple-500/30 animate-pulse"
                      : "bg-slate-700"
                  }`}>
                    {reward.claimed ? (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : reward.achieved ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" />
                        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-sm font-semibold truncate ${
                      reward.claimed ? "text-emerald-300" : reward.achieved ? "text-purple-300" : "text-gray-500"
                    }`}>
                      {reward.title}
                    </div>
                    <div className={`text-[10px] font-medium ${
                      reward.claimed 
                        ? "text-emerald-400" 
                        : reward.achieved 
                        ? "text-yellow-300" 
                        : "text-gray-600"
                    }`}>
                      {reward.claimed ? "✓ 已領取" : reward.achieved ? "🎁 點擊領取" : "🔒 未解鎖"}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
