"use client";

import { motion } from "framer-motion";

interface CelebrationCheckmarkProps {
  size?: number; // 默认 220
  className?: string;
}

export function CelebrationCheckmark({
  size = 220,
  className = "",
}: CelebrationCheckmarkProps) {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="-120 -120 240 240"
        className="w-full h-full overflow-visible"
      >
        {/* 1. 外层浅薄荷绿柔光背景环 */}
        <motion.circle
          cx="0"
          cy="0"
          r="86"
          fill="rgba(209, 250, 229, 0.45)"
          stroke="rgba(52, 211, 153, 0.32)"
          strokeWidth="1.5"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />

        {/* 2. 缤纷发散彩带与几何碎片粒子群 (Confetti & Streamers) */}
        {/* 橙色彩带 (左上) */}
        <motion.path
          d="M-42 -64 Q-22 -82 -54 -102"
          fill="none"
          stroke="#F97316"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1, rotate: [0, 8, 0] }}
          transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
        />

        {/* 红色彩带 (左中) */}
        <motion.path
          d="M-72 -18 Q-98 -8 -92 -42"
          fill="none"
          stroke="#EF4444"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
        />

        {/* 绿色曲色彩带 (右上) */}
        <motion.path
          d="M20 -68 Q28 -90 40 -64"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.14, ease: "easeOut" }}
        />

        {/* 橙黄色彩带 (右上) */}
        <motion.path
          d="M44 -64 Q68 -84 52 -100"
          fill="none"
          stroke="#F59E0B"
          strokeWidth="3.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.16, ease: "easeOut" }}
        />

        {/* 红色彩带 (右下) */}
        <motion.path
          d="M74 12 Q98 28 86 52"
          fill="none"
          stroke="#EF4444"
          strokeWidth="3.6"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
        />

        {/* 绿色彩带 (左下) */}
        <motion.path
          d="M-52 70 Q-74 86 -64 102"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
        />

        {/* 绿色彩带 (正下) */}
        <motion.path
          d="M-40 102 Q-32 94 -26 100"
          fill="none"
          stroke="#10B981"
          strokeWidth="3.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        {/* ── 几何碎片 (方块、三角、圆点、菱形) ── */}
        {/* 红色方块 (左上) */}
        <motion.rect
          x="-78"
          y="-62"
          width="8"
          height="8"
          rx="1.5"
          fill="#EF4444"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 12 }}
          transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.12 }}
        />

        {/* 橙色椭圆胶囊 (正上左) */}
        <motion.rect
          x="-54"
          y="-92"
          width="8"
          height="5"
          rx="2.5"
          fill="#F97316"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.1 }}
        />

        {/* 橙色倒三角 (左上) */}
        <motion.polygon
          points="-38,-65 -30,-65 -34,-57"
          fill="#F97316"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 18, delay: 0.14 }}
        />

        {/* 红色小圆 (正上右) */}
        <motion.circle
          cx="44"
          cy="-90"
          r="3.5"
          fill="#EF4444"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 }}
        />

        {/* 橙色椭圆 (右上) */}
        <motion.circle
          cx="88"
          cy="-86"
          r="3.8"
          fill="#F97316"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.17 }}
        />

        {/* 蓝色小方块 (右上角) */}
        <motion.rect
          x="96"
          y="-82"
          width="7"
          height="7"
          rx="1"
          fill="#0284C7"
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: 1, rotate: 20 }}
          transition={{ delay: 0.18 }}
        />

        {/* 蓝色小三角 (右侧偏上) */}
        <motion.polygon
          points="88,-58 97,-54 94,-64"
          fill="#0284C7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.19 }}
        />

        {/* 橙色正方形 (左侧靠中) */}
        <motion.rect
          x="-62"
          y="-36"
          width="7.5"
          height="7.5"
          rx="1"
          fill="#FB923C"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 }}
        />

        {/* 蓝色小圆点 (左侧偏下) */}
        <motion.circle
          cx="-58"
          cy="-4"
          r="4.2"
          fill="#0284C7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.16 }}
        />

        {/* 蓝色小三角 (左侧偏下) */}
        <motion.polygon
          points="-63,22 -54,26 -63,30"
          fill="#0EA5E9"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.18 }}
        />

        {/* 蓝色小菱形 (左下角) */}
        <motion.polygon
          points="-60,54 -54,61 -60,68 -66,61"
          fill="#0284C7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* 绿色实心圆 (左下偏内) */}
        <motion.circle
          cx="-52"
          cy="74"
          r="4.2"
          fill="#10B981"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.22 }}
        />

        {/* 红色小圆 (左下靠内) */}
        <motion.circle
          cx="-26"
          cy="38"
          r="3.5"
          fill="#EF4444"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.17 }}
        />

        {/* 橙黄小三角 (正下偏左) */}
        <motion.polygon
          points="2,76 10,76 6,84"
          fill="#F59E0B"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.23 }}
        />

        {/* 绿色小点 (正下) */}
        <motion.circle
          cx="42"
          cy="92"
          r="3.2"
          fill="#10B981"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.24 }}
        />

        {/* 红色粗方块 (右侧偏中) */}
        <motion.rect
          x="94"
          y="-8"
          width="9"
          height="12"
          rx="1"
          fill="#EF4444"
          initial={{ scale: 0, rotate: 15 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ delay: 0.19 }}
        />

        {/* 绿色斜菱形 (右下角) */}
        <motion.polygon
          points="76,56 83,61 80,69 73,64"
          fill="#10B981"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.21 }}
        />

        {/* 蓝色小圆点 (右下外圈) */}
        <motion.circle
          cx="96"
          cy="60"
          r="3.4"
          fill="#0284C7"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.22 }}
        />

        {/* 3. 核心翠绿大实心圆 (The Vibrant Green Circle) */}
        <motion.circle
          cx="0"
          cy="0"
          r="54"
          fill="#22C55E"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 20,
            mass: 0.75,
          }}
          style={{
            filter: "drop-shadow(0px 14px 28px rgba(34, 197, 94, 0.42))",
          }}
        />

        {/* 4. 圆心内纯白圆润粗对勾 (The Thick White Checkmark) */}
        <motion.path
          d="M-22 2 L-5 21 L26 -16"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            duration: 0.45,
            ease: "easeOut",
            delay: 0.2,
          }}
        />
      </svg>
    </div>
  );
}
