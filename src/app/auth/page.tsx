"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ZenLogo3D } from "@/components/ZenLogo3D";
import { InkRippleButton } from "@/components/InkRippleButton";
import { ForgotPasswordCard } from "@/components/ForgotPasswordCard";
import AuthPreloader from "@/components/AuthPreloader";

// Dynamic import MindfulJourney (恒河圣境 · 视差互动背景)
const MindfulJourney = dynamic(
  () => import("@/components/MindfulJourney").then((mod) => ({ default: mod.MindfulJourney })),
  { ssr: false }
);

type Mode = "login" | "register" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(true);

  // -------- 提前预加载仪表板页面代码包，实现登录后 0ms 客户端秒开切入 --------
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  // -------- 模拟 / 管理加载完成状态 (优雅过渡 800ms) --------
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // -------- 加载期间锁定滚动 --------
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8 sm:py-12">
      {/* -------- Auth 入场 Preloader -------- */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <AuthPreloader
            key="auth-preloader"
            onDismiss={() => setIsLoading(false)}
          />
        )}
      </AnimatePresence>

      {/* -------- 返回首页快捷入口 (仅在表单呈现后淡入，避免加载时重叠) -------- */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-5 top-5 z-40"
          >
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:bg-white/25 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>返回首页</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 1. 恒河圣境与 3D 禅境湖泊融合全景背景 ── */}
      <Suspense fallback={null}>
        <MindfulJourney />
      </Suspense>

      {/* ── 2. 3D 悬浮 Logo 与表单（仅在 Preloader 退场后挂载入 DOM，彻底解决加载界面提前弹出钥匙串密码提示的问题） ── */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div
            key="auth-content"
            className="relative z-10 flex w-full flex-col items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ZenLogo3D />

            {/* ── 3. 极致玻璃态前景表单卡片 ── */}
            <div className="relative z-10 w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, rotateY: -90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: 90 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="transform-gpu will-change-transform backface-hidden"
                  style={{ perspective: 1200 }}
                >
                  <LoginCard
                    onSwitch={() => setMode("register")}
                    onForgotPassword={() => setMode("forgot")}
                  />
                </motion.div>
              ) : mode === "register" ? (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  exit={{ opacity: 0, rotateY: -90 }}
                  transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                  className="transform-gpu will-change-transform backface-hidden"
                  style={{ perspective: 1200 }}
                >
                  <RegisterCard onSwitch={() => setMode("login")} />
                </motion.div>
              ) : (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="transform-gpu will-change-transform"
                >
                  <ForgotPasswordCard onBackToLogin={() => setMode("login")} />
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  玻璃态卡片样式 (共用 - 优雅明亮磨砂白玉风)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const GLASS_CARD_CLASS =
  "rounded-3xl border border-white/80 " +
  "bg-white/90 backdrop-blur-2xl " +
  "p-6 sm:p-8 " +
  "shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.7)_inset]";

const INPUT_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-stone-200/90 " +
  "bg-white/95 " +
  "pl-11 pr-4 text-sm text-stone-800 font-medium " +
  "shadow-inner shadow-black/[0.03] " +
  "outline-none transition-all " +
  "placeholder:text-stone-400 " +
  "focus:border-golden-deep focus:ring-2 focus:ring-golden-deep/20 focus:bg-white " +
  "backdrop-blur-sm";

const INPUT_PW_CLASS =
  "h-12 w-full rounded-xl " +
  "border border-stone-200/90 " +
  "bg-white/95 " +
  "pl-11 pr-12 text-sm text-stone-800 font-medium " +
  "shadow-inner shadow-black/[0.03] " +
  "outline-none transition-all " +
  "placeholder:text-stone-400 " +
  "focus:border-golden-deep focus:ring-2 focus:ring-golden-deep/20 focus:bg-white " +
  "backdrop-blur-sm";

const LABEL_CLASS = "mb-1.5 block text-xs font-bold text-stone-700";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  登录卡片
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function LoginCard({
  onSwitch,
  onForgotPassword,
}: {
  onSwitch: () => void;
  onForgotPassword: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("请填写完整的登录信息");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "登录失败");
        return;
      }

      // 瞬时写入认证与当前选定会员，供仪表板首帧读取
      localStorage.setItem("jbs_auth_user", JSON.stringify(data));
      if (data.memberId) {
        localStorage.setItem("currentMemberId", data.memberId);
      }

      toast.success(`欢迎回来，${data.name}！`, {
        description: "正在开启修持仪表板…",
        icon: "🪷",
      });

      // 仅留出 150ms 供微交互视觉反馈，随后立即执行 Next.js SPA 极速切页，消灭硬刷新与白屏停顿
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 150);
    } catch {
      toast.error("网络错误，请检查您的连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on">
      <div className={GLASS_CARD_CLASS}>
        <h2 className="mb-1 text-xl font-bold text-stone-900">登录您的账户</h2>
        <p className="mb-7 text-sm text-stone-500">
          输入您的邮箱和密码，继续您的修行之旅
        </p>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="login-email" className={LABEL_CLASS}>
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className={LABEL_CLASS}>
              密码
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-semibold text-golden-deep hover:text-ocher transition-colors underline-offset-2 hover:underline"
            >
              忘记密码？
            </button>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_PW_CLASS}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 transition-colors hover:text-golden-deep"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* 提交按钮 */}
        <InkRippleButton
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep via-golden-rich to-ocher py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                登录中…
              </>
            ) : (
              "登 录"
            )}
          </span>
          {/* 呼吸发光 */}
          {!loading && (
            <motion.div
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white"
            />
          )}
        </InkRippleButton>

        {/* 切换至注册 */}
        <p className="mt-6 text-center text-sm text-stone-600">
          还没有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-bold text-golden-deep underline-offset-2 transition-colors hover:text-ocher hover:underline"
          >
            立即注册
          </button>
        </p>
      </div>
    </form>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  注册卡片
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function RegisterCard({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"理事" | "学员" | "学长姐">("学员");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("请填写完整的注册信息");
      return;
    }

    if (password.length < 6) {
      toast.error("密码长度至少为 6 个字符");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致，请仔细核对");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, birthday: birthday || undefined, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "注册失败");
        return;
      }

      // 注册成功，直接写入认证会话
      localStorage.setItem("jbs_auth_user", JSON.stringify(data));
      if (data.memberId) {
        localStorage.setItem("currentMemberId", data.memberId);
      }

      toast.success("注册成功，法喜充满！", {
        description: `您的专属会员编号为 ${data.memberCode || data.memberId}，正在为您开启修行空间…`,
        icon: "🪷",
        duration: 3000,
      });

      // 极速无缝进入仪表板
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 150);
    } catch {
      toast.error("网络错误，请检查您的连接");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on">
      <div className={GLASS_CARD_CLASS}>
        <h2 className="mb-1 text-xl font-bold text-stone-900">创建新账户</h2>
        <p className="mb-7 text-sm text-stone-500">
          加入技大佛学会，开启功德积分之旅
        </p>

        {/* 姓名 */}
        <div className="mb-5">
          <label htmlFor="register-name" className={LABEL_CLASS}>
            姓名
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="您的法名或本名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 身份类型 */}
        <div className="mb-5">
          <label className={LABEL_CLASS}>
            修持身份
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "学员", label: "学员", desc: "常随佛学", icon: "🌱" },
              { key: "理事", label: "理事", desc: "统筹护持", icon: "🪷" },
              { key: "学长姐", label: "学长姐", desc: "导引提携", icon: "🏮" },
            ].map((item) => {
              const selected = role === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRole(item.key as "理事" | "学员" | "学长姐")}
                  className={`relative flex flex-col items-center justify-center rounded-xl p-2.5 transition-all text-center cursor-pointer ${
                    selected
                      ? "border-2 border-golden-deep bg-golden-deep/10 text-stone-900 shadow-sm shadow-golden-deep/20 ring-1 ring-golden-deep/40"
                      : "border border-stone-200/90 bg-white/70 text-stone-600 hover:bg-white hover:border-stone-300"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="mt-1 text-xs font-bold leading-tight">{item.label}</span>
                  <span className="mt-0.5 text-[10px] text-stone-400 font-medium">{item.desc}</span>
                  {selected && (
                    <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-golden-deep opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-golden-deep"></span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 邮箱 */}
        <div className="mb-5">
          <label htmlFor="register-email" className={LABEL_CLASS}>
            电子邮箱
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* 出生日期 (日历选择器) */}
        <div className="mb-5">
          <label htmlFor="register-birthday" className="mb-1.5 flex items-center justify-between text-xs font-bold text-stone-700">
            <span>出生日期 (选填)</span>
            <span className="text-[10px] font-semibold text-golden-deep">✨ 生日当天有惊喜</span>
          </label>
          <div className="relative">
            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 z-10" />
            <input
              id="register-birthday"
              name="birthday"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              min="1920-01-01"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={`${INPUT_CLASS} cursor-pointer text-stone-800`}
            />
          </div>
        </div>

        {/* 密码 */}
        <div className="mb-3">
          <label htmlFor="register-password" className={LABEL_CLASS}>
            设置密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-password"
              name="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="至少 6 个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT_PW_CLASS}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 transition-colors hover:text-golden-deep"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>

        {/* 密码强度指示器 */}
        <div className="mb-5">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map((level) => (
              <motion.div
                key={level}
                className="h-1.5 flex-1 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: password.length > 0 ? 1 : 0,
                  backgroundColor:
                    passwordStrength >= level
                      ? passwordStrength <= 1
                        ? "#e63946"
                        : passwordStrength <= 2
                        ? "#f4a261"
                        : passwordStrength <= 3
                        ? "#e9c46a"
                        : "#2a9d8f"
                      : "rgba(0,0,0,0.08)",
                }}
                transition={{ duration: 0.3, delay: level * 0.05 }}
                style={{ originX: 0 }}
              />
            ))}
          </div>
          {password.length > 0 && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 text-[11px] font-semibold"
              style={{
                color:
                  passwordStrength <= 1
                    ? "#e63946"
                    : passwordStrength <= 2
                    ? "#e76f51"
                    : passwordStrength <= 3
                    ? "#b45309"
                    : "#2a9d8f",
              }}
            >
              {passwordStrength <= 1
                ? "弱 — 建议使用更复杂的密码"
                : passwordStrength <= 2
                ? "一般 — 可加入数字或符号"
                : passwordStrength <= 3
                ? "良好 — 安全性尚可"
                : "强 — 非常安全"}
            </motion.p>
          )}
        </div>

        {/* 确认密码 */}
        <div className="mb-7">
          <label htmlFor="register-confirm-password" className={LABEL_CLASS}>
            确认密码
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="register-confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="请再次输入相同密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={INPUT_PW_CLASS}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-stone-400 transition-colors hover:text-golden-deep"
              aria-label={showConfirmPassword ? "隐藏确认密码" : "显示确认密码"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <p className="mt-1.5 text-[11px] font-semibold text-rose-500 flex items-center gap-1">
              ⚠️ 两次输入的密码不一致
            </p>
          )}
          {confirmPassword.length > 0 && password === confirmPassword && (
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              ✓ 密码一致
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <InkRippleButton
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.01 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-golden-deep via-golden-rich to-ocher py-3 text-sm font-bold text-white shadow-lg shadow-golden-deep/30 transition-all disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                注册中…
              </>
            ) : (
              "创建账户"
            )}
          </span>
          {/* 呼吸发光 */}
          {!loading && (
            <motion.div
              animate={{ opacity: [0, 0.15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-white"
            />
          )}
        </InkRippleButton>

        {/* 切换至登录 */}
        <p className="mt-6 text-center text-sm text-stone-600">
          已有账号？{" "}
          <button
            type="button"
            onClick={onSwitch}
            className="font-bold text-golden-deep underline-offset-2 transition-colors hover:text-ocher hover:underline"
          >
            立即登录
          </button>
        </p>
      </div>
    </form>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  密码强度计算
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getPasswordStrength(password: string): number {
  if (password.length === 0) return 0;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return Math.min(4, score);
}
