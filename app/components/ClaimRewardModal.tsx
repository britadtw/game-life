"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type ClaimRewardModalProps = {
  isOpen: boolean;
  rewardTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function ClaimRewardModal({
  isOpen,
  rewardTitle,
  onClose,
  onConfirm,
}: ClaimRewardModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (showSuccess) {
      // Generate celebration particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 200 - 100,
        y: Math.random() * -150 - 50,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);

      // Auto close after animation
      const timer = setTimeout(() => {
        setShowSuccess(false);
        setParticles([]);
        onClose();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [showSuccess, onClose]);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to claim reward:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading && !showSuccess) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl border-2 border-cyan-500/30 shadow-2xl overflow-hidden w-full max-w-md"
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-50" />

            {/* Content */}
            <div className="relative p-8">
              {showSuccess ? (
                /* Success State */
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {/* Celebration Particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {particles.map((particle) => (
                      <motion.div
                        key={particle.id}
                        className="absolute left-1/2 top-1/2 w-3 h-3"
                        initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                        animate={{
                          x: particle.x,
                          y: particle.y,
                          scale: [0, 1.5, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          delay: particle.delay,
                          ease: "easeOut",
                        }}
                      >
                        <div className={`w-full h-full rounded-full ${
                          particle.id % 3 === 0
                            ? "bg-yellow-400"
                            : particle.id % 3 === 1
                            ? "bg-cyan-400"
                            : "bg-pink-400"
                        }`} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Success Icon */}
                  <motion.div
                    className="relative mx-auto w-24 h-24 mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full animate-pulse shadow-2xl shadow-yellow-500/50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </motion.div>

                  {/* Success Message */}
                  <motion.h2
                    className="text-3xl font-black mb-3 bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    🎉 恭喜獲得獎勵！
                  </motion.h2>
                  
                  <motion.p
                    className="text-xl text-cyan-300 font-semibold"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    {rewardTitle}
                  </motion.p>
                </motion.div>
              ) : (
                /* Confirmation State */
                <>
                  {/* Header */}
                  <div className="text-center mb-8">
                    <motion.div
                      className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-yellow-500/30"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        boxShadow: [
                          "0 10px 15px -3px rgba(234, 179, 8, 0.3)",
                          "0 20px 25px -5px rgba(234, 179, 8, 0.5)",
                          "0 10px 15px -3px rgba(234, 179, 8, 0.3)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" />
                        <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
                      </svg>
                    </motion.div>

                    <h2 className="text-2xl font-bold text-white mb-2">領取獎勵</h2>
                    <p className="text-gray-400">確定要領取這個獎勵嗎？</p>
                  </div>

                  {/* Reward Info */}
                  <div className="bg-slate-800/50 rounded-2xl p-6 mb-8 border border-cyan-500/20">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">獎勵名稱</p>
                        <p className="text-xl font-bold text-cyan-300">{rewardTitle}</p>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <button
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1 py-4 px-6 rounded-xl bg-slate-700/50 text-gray-300 font-semibold border border-slate-600 hover:bg-slate-600/50 transition-all disabled:opacity-50"
                    >
                      取消
                    </button>
                    <motion.button
                      onClick={handleConfirm}
                      disabled={isLoading}
                      className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 text-white font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          處理中...
                        </span>
                      ) : (
                        "確定領取 🎁"
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
