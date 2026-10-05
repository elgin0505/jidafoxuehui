"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CelebrationCheckmark } from "./CelebrationCheckmark";
import { X, Sparkles } from "lucide-react";

interface CheckInToastProps {
  memberName: string;
  memberId: string;
  pointsEarned: number;
  visible: boolean;
  onDismiss: () => void;
}

export function CheckInToast({
  memberName,
  memberId,
  pointsEarned,
  visible,
  onDismiss,
}: CheckInToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onDismiss, 3800);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, onDismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="checkin-celebration-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-md"
          onClick={onDismiss}
        >
          <motion.div
            key="checkin-celebration-card"
            initial={{ scale: 0.72, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 24,
              mass: 0.85,
            }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center max-w-sm w-full mx-auto px-6 py-7 sm:px-8 sm:py-8 rounded-3xl bg-[#FAF8F5] dark:bg-[#1E1E1E] border-2 border-emerald-400/30 shadow-[0_25px_60px_-10px_rgba(16,185,129,0.3),0_0_0_1px_rgba(255,255,255,0.7)] text-center overflow-hidden"
          >
            {/* 顶部优雅关闭按钮 */}
            <button
              onClick={onDismiss}
              className="absolute right-3.5 top-3.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/5 dark:bg-white/10 text-muted transition-colors hover:bg-charcoal/10 hover:text-charcoal"
              aria-label="关闭"
            >
              <X className="h-4 w-4" />
            </button>

            {/* 柔和环境光渐变底色 */}
            <div className="absolute inset-0 bg-radial-gradient from-emerald-100/50 via-transparent to-transparent pointer-events-none" />

            {/* 1. 核心签到成功特效：翠绿实心圆 + 纯白粗对勾 + 缤纷几何彩带粒子群 */}
            <div className="my-1">
              <CelebrationCheckmark size={210} />
            </div>

            {/* 2. 仪式感文案 */}
            <div className="mt-2 space-y-1">
              <motion.h3
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.35 }}
                className="text-2xl font-extrabold text-charcoal font-serif tracking-tight"
              >
                签到成功
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.35 }}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 inline-block px-3 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/40"
              >
                法喜充满 · 福慧双增
              </motion.p>
            </div>

            {/* 3. 同修身份与学号 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.26 }}
              className="mt-3 flex items-center justify-center gap-1.5"
            >
              <span className="text-base font-bold text-charcoal truncate max-w-[200px]">
                {memberName || "精进同修"}
              </span>
              {memberId && (
                <span className="text-xs text-muted font-medium">({memberId})</span>
              )}
            </motion.div>

            {/* 4. 积分奖励勋章 */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 20 }}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-golden-rich/15 to-emerald-500/15 border border-golden-rich/35 text-golden-deep font-bold text-sm shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-golden-rich animate-pulse" />
              <span>已圆满累计 +{pointsEarned} 功德积分</span>
            </motion.div>

            {/* 5. 底部自动倒计时平滑进度条 */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3.7, ease: "linear" }}
              style={{ originX: 0 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
