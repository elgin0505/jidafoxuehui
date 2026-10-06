'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AuthPreloaderProps {
  dotCount?: number;   // 进度点数量，默认 9
  radius?: number;     // 进度环半径（px）
  emojiSrc?: string;   // 可选外部图片（若未提供则使用高清 3D 动画表情包）
  emojiAlt?: string;
  onDismiss?: () => void;
}

/**
 * 🌟 生动逼真 3D 黏土风动画表情包组件 (Animated 3D Clay Emoji)
 * - 眼睛灵活眨眼 (Blinking) 与左右眼神顾盼 (Pupil Saccades)
 * - 嘴巴立体微笑并富有弹性地舒展 (Dynamic Smile Breathing)
 * - 腮红随微笑提升微动 (Cheek Squash & Stretch)
 * - 眉毛轻微挑动增加灵气与生命感
 */
export function Animated3DEmoji({ className = 'h-32 w-32 md:h-40 md:w-40' }: { className?: string }) {
  return (
    <div
      className={`relative z-10 select-none pointer-events-none ${className}`}
      style={{
        width: '140px',
        height: '140px',
        maxWidth: '100%',
        maxHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        viewBox="0 0 400 400"
        width="140"
        height="140"
        style={{ width: '100%', height: '100%', maxWidth: '140px', maxHeight: '140px', display: 'block' }}
        className="h-full w-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Head 3D Sphere Gradients */}
          <radialGradient id="headBase" cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#FFF599" />
            <stop offset="30%" stopColor="#FFDD38" />
            <stop offset="68%" stopColor="#F5A405" />
            <stop offset="90%" stopColor="#D46F00" />
            <stop offset="100%" stopColor="#A34600" />
          </radialGradient>

          {/* Head Top Soft Specular */}
          <radialGradient id="headHighlight" cx="34%" cy="22%" r="38%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="45%" stopColor="#FFF7B8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFDE3B" stopOpacity="0" />
          </radialGradient>

          {/* Eyeball 3D White Domes */}
          <radialGradient id="eyeWhite" cx="36%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F3F5F8" />
            <stop offset="85%" stopColor="#D7DFE8" />
            <stop offset="100%" stopColor="#B2BECC" />
          </radialGradient>

          {/* Pupil 3D Gradients */}
          <radialGradient id="pupilGrad" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#4E2B1A" />
            <stop offset="60%" stopColor="#28140B" />
            <stop offset="100%" stopColor="#120703" />
          </radialGradient>

          {/* Cheek Blush 3D Gradients */}
          <radialGradient id="blushGrad" cx="38%" cy="32%" r="60%">
            <stop offset="0%" stopColor="#FFA2B4" />
            <stop offset="65%" stopColor="#F45C7A" />
            <stop offset="100%" stopColor="#C92E4E" />
          </radialGradient>

          {/* Drop Shadows for 3D Depth */}
          <filter id="eyeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="7" stdDeviation="6" floodColor="#803E00" floodOpacity="0.45" />
          </filter>

          <filter id="pupilShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#120703" floodOpacity="0.4" />
          </filter>

          <filter id="blushShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#802800" floodOpacity="0.32" />
          </filter>

          <filter id="mouthShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="3.5" stdDeviation="3" floodColor="#6E1C00" floodOpacity="0.42" />
          </filter>
        </defs>

        {/* ── 3D 头部黄色主球体 ── */}
        <circle cx="200" cy="200" r="165" fill="url(#headBase)" />
        <circle cx="200" cy="200" r="165" fill="url(#headHighlight)" />

        {/* ── 灵动眉毛微表情 ── */}
        <motion.path
          d="M 122 118 Q 140 108 158 116"
          stroke="#804000"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.32"
          animate={{
            y: [0, -3.5, 0.5, -2, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.path
          d="M 242 116 Q 260 108 278 118"
          stroke="#804000"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          opacity="0.32"
          animate={{
            y: [0, -3.5, 0.5, -2, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ── 左眼（自然眨眼与顾盼转动）── */}
        <motion.g
          style={{ transformOrigin: '140px 166px' }}
          animate={{
            scaleY: [1, 1, 0.08, 1, 1, 1, 0.08, 1, 1],
          }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            times: [0, 0.44, 0.47, 0.50, 0.72, 0.74, 0.77, 0.80, 1],
            ease: 'easeInOut',
          }}
        >
          <ellipse cx="140" cy="166" rx="42" ry="46" fill="url(#eyeWhite)" filter="url(#eyeShadow)" />

          {/* 左眼珠与高光（平滑顾盼） */}
          <motion.g
            animate={{
              x: [0, -5, 4, -1, 0],
              y: [0, -3.5, 1, -2, 0],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ellipse cx="132" cy="158" rx="20" ry="22" fill="url(#pupilGrad)" filter="url(#pupilShadow)" />
            <circle cx="125" cy="150" r="6" fill="#FFFFFF" opacity="0.95" />
            <circle cx="137" cy="167" r="2.5" fill="#FFFFFF" opacity="0.65" />
          </motion.g>
        </motion.g>

        {/* ── 右眼（自然眨眼与顾盼转动）── */}
        <motion.g
          style={{ transformOrigin: '260px 166px' }}
          animate={{
            scaleY: [1, 1, 0.08, 1, 1, 1, 0.08, 1, 1],
          }}
          transition={{
            duration: 4.2,
            repeat: Infinity,
            times: [0, 0.44, 0.47, 0.50, 0.72, 0.74, 0.77, 0.80, 1],
            ease: 'easeInOut',
          }}
        >
          <ellipse cx="260" cy="166" rx="42" ry="46" fill="url(#eyeWhite)" filter="url(#eyeShadow)" />

          {/* 右眼珠与高光（平滑顾盼） */}
          <motion.g
            animate={{
              x: [0, -5, 4, -1, 0],
              y: [0, -3.5, 1, -2, 0],
            }}
            transition={{
              duration: 4.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <ellipse cx="252" cy="158" rx="20" ry="22" fill="url(#pupilGrad)" filter="url(#pupilShadow)" />
            <circle cx="245" cy="150" r="6" fill="#FFFFFF" opacity="0.95" />
            <circle cx="257" cy="167" r="2.5" fill="#FFFFFF" opacity="0.65" />
          </motion.g>
        </motion.g>

        {/* ── 左粉嫩腮红（随微笑上扬）── */}
        <motion.g
          style={{ transformOrigin: '106px 220px' }}
          animate={{
            scale: [1, 1.12, 0.98, 1.15, 1],
            y: [0, -2.5, 0.5, -3, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ellipse
            cx="106"
            cy="220"
            rx="26"
            ry="17"
            fill="url(#blushGrad)"
            filter="url(#blushShadow)"
            transform="rotate(-8 106 220)"
          />
        </motion.g>

        {/* ── 右粉嫩腮红（随微笑上扬）── */}
        <motion.g
          style={{ transformOrigin: '294px 220px' }}
          animate={{
            scale: [1, 1.12, 0.98, 1.15, 1],
            y: [0, -2.5, 0.5, -3, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <ellipse
            cx="294"
            cy="220"
            rx="26"
            ry="17"
            fill="url(#blushGrad)"
            filter="url(#blushShadow)"
            transform="rotate(8 294 220)"
          />
        </motion.g>

        {/* ── 立体生动微笑嘴巴（呼吸与舒展微笑）── */}
        <motion.g
          style={{ transformOrigin: '200px 248px' }}
          animate={{
            scaleX: [1, 1.07, 0.98, 1.12, 1],
            scaleY: [1, 1.22, 0.95, 1.28, 1],
            y: [0, -3, 1, -4, 0],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* 嘴唇底层阴影 */}
          <path
            d="M 146 244 C 172 276, 228 276, 254 244"
            fill="none"
            stroke="#B82218"
            strokeWidth="13"
            strokeLinecap="round"
            filter="url(#mouthShadow)"
          />
          {/* 嘴唇主色 */}
          <path
            d="M 148 244 C 173 273, 227 273, 252 244"
            fill="none"
            stroke="#E64438"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* 嘴唇 3D 瓷亮反光 */}
          <path
            d="M 152 244 C 174 269, 226 269, 248 244"
            fill="none"
            stroke="#FFA399"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.65"
          />
        </motion.g>
      </svg>
    </div>
  );
}

const AuthPreloader: React.FC<AuthPreloaderProps> = ({
  dotCount = 9,
  radius = 22,
  emojiSrc,
  emojiAlt = 'Loading',
  onDismiss,
}) => {
  // 每个进度点的角度间隔
  const angleStep = 360 / dotCount;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-stone-950"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0c0e14',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
      transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
    >
      {/* 居中容器（承载表情 + 进度环） */}
      <div
        className="relative flex items-center justify-center"
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* -------- 呼吸 + 悬浮与微晃动点头的表情主体 -------- */}
        <motion.div
          className="relative"
          animate={{
            y: [0, -12, 0],
            rotate: [-1.5, 2, -1, 1.5, -1.5],
            scale: [1, 1.03, 0.99, 1.03, 1],
          }}
          transition={{
            duration: 3.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* 背后的柔光晕（与表情同步呼吸） */}
          <motion.div
            className="absolute inset-0 m-auto h-40 w-40 rounded-full bg-amber-400/20 blur-3xl"
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [0.9, 1.1, 0.9],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            aria-hidden="true"
          />

          {/* 表情呈现：优先使用活灵活现的动眼、微笑 3D 黏土表情包 */}
          {emojiSrc && emojiSrc !== '/emoji-face.png' ? (
            <motion.img
              src={emojiSrc}
              alt={emojiAlt}
              className="relative z-10 h-32 w-32 select-none pointer-events-none md:h-40 md:w-40"
              style={{ width: '140px', height: '140px', objectFit: 'contain' }}
              draggable={false}
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.fallback-emoji')) {
                  const span = document.createElement('span');
                  span.className = 'fallback-emoji relative z-10 text-7xl md:text-8xl';
                  span.textContent = '🙂';
                  parent.appendChild(span);
                }
              }}
            />
          ) : (
            <Animated3DEmoji className="h-32 w-32 md:h-40 md:w-40" />
          )}

          {/* -------- 9 点进度环（右上角）-------- */}
          <div
            className="absolute z-20"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '60px',
              height: '60px',
            }}
            aria-hidden="true"
          >
            {Array.from({ length: dotCount }).map((_, index) => {
              const angle = angleStep * index;
              return (
                <div
                  key={index}
                  className="auth-preloader-dot"
                  style={{
                    ['--index' as string]: index,
                    ['--angle' as string]: `${angle}deg`,
                    ['--radius' as string]: `${radius}px`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '5px',
                    height: '10px',
                    marginTop: '-5px',
                    marginLeft: '-2.5px',
                    borderRadius: '9999px',
                    backgroundColor: '#d1d5db',
                    transform: `rotate(${angle}deg) translateY(-${radius}px)`,
                    animationDelay: `${index * 0.1}s`,
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* 快捷跳过 / 点击进入入口（避免极端慢网或卡顿情况下阻断用户） */}
      {onDismiss && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          onClick={onDismiss}
          className="mt-6 text-xs text-stone-400 hover:text-white transition-all cursor-pointer px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm"
          style={{
            marginTop: '24px',
            fontSize: '12px',
            color: '#9ca3af',
            cursor: 'pointer',
            padding: '6px 14px',
            borderRadius: '9999px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          点击直接进入 →
        </motion.button>
      )}

      {/* -------- 全局 CSS 动画（在组件内联注入，避免污染全局样式）-------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes auth-preloader-chase {
          0%,
          100% {
            background-color: #d1d5db;
            transform: rotate(var(--angle)) translateY(calc(-1 * var(--radius, 22px))) scale(1);
            opacity: 0.45;
            box-shadow: none;
          }
          50% {
            background-color: #ffffff;
            transform: rotate(var(--angle)) translateY(calc(-1 * var(--radius, 22px))) scale(1.1);
            opacity: 1;
            box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
          }
        }

        .auth-preloader-dot {
          animation: auth-preloader-chase 1.2s ease-in-out infinite;
          will-change: background-color, opacity, box-shadow;
        }
      `,
        }}
      />
    </motion.div>
  );
};

export default AuthPreloader;
export { AuthPreloader };
