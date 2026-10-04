"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  Card,
  Badge,
  MemberAvatar,
  EmptyState,
} from "@/components/ui";
import { useMember } from "@/components/MemberContext";
import { Leaderboard } from "@/components/Leaderboard";
import { CheckInToast } from "@/components/CheckInToast";
import LiquidOrbButton from "@/components/LiquidOrbButton";
import { Card3D } from "@/components/Card3D";
import { GoldShimmerBorder } from "@/components/GoldShimmerBorder";
import { DharmaBadges, DHARMA_LEVELS } from "@/components/DharmaBadges";
import { TimelineView } from "@/components/TimelineView";
import { Dashboard3DMenu } from "@/components/Dashboard3DMenu";
import { motion, AnimatePresence } from "framer-motion";
import { toast as sonnerToast } from "sonner";
import { Camera } from "lucide-react";
import { LivingBodhiTree } from "@/components/LivingBodhiTree";
import type { LotusSeaCanvasProps } from "@/components/LotusSeaCanvas";

// 按需异步代码分割：非首屏重型弹窗、扫码库与背景画布
const LotusSeaCanvas = dynamic<LotusSeaCanvasProps>(() => import("@/components/LotusSeaCanvas"), { ssr: false });
const QRScanner = dynamic(() => import("@/components/QRScanner").then((mod) => ({ default: mod.QRScanner })), { ssr: false });
const QRModal = dynamic(() => import("@/components/QRModal").then((mod) => ({ default: mod.QRModal })), { ssr: false });
const DailyDharmaCard = dynamic(() => import("@/components/DailyDharmaCard").then((mod) => ({ default: mod.DailyDharmaCard })), { ssr: false });
const KaresansuiBackground = dynamic(() => import("@/components/KaresansuiBackground").then((mod) => ({ default: mod.KaresansuiBackground })), { ssr: false });
const Confetti = dynamic(() => import("react-confetti"), { ssr: false });

interface AttendanceRecord {
  id: string;
  dateTime: string;
  eventName: string;
  pointsEarned: number;
}

interface MemberDetail {
  attendances: AttendanceRecord[];
  redemptions: {
    id: string;
    pointsSpent: number;
    createdAt: string;
    reward: { name: string };
  }[];
}

interface ToastData {
  memberName: string;
  memberId: string;
  pointsEarned: number;
}

export interface DashboardClientProps {
  initialMemberId?: string;
  initialTab?: "history" | "leaderboard" | "badges";
}

import { MemberCardSkeleton } from "./MemberCardSkeleton";
export { MemberCardSkeleton };

export default function DashboardClient({
  initialMemberId,
  initialTab = "history",
}: DashboardClientProps) {
  const { currentMember, members, loading, refreshMembers, setCurrentMemberId } = useMember();
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "leaderboard" | "badges">(initialTab);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [showBirthdayConfetti, setShowBirthdayConfetti] = useState(false);
  const [showLotusCanvas, setShowLotusCanvas] = useState(false);
  const [liveEventsCount, setLiveEventsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    // 滚动期间暂停无限循环 CSS 动画，释放移动端 GPU 算力保证 60/120fps 流畅
    let scrollTimer: NodeJS.Timeout;
    const onScroll = () => {
      if (!document.body.classList.contains("is-scrolling")) {
        document.body.classList.add("is-scrolling");
      }
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        document.body.classList.remove("is-scrolling");
      }, 150);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
      document.body.classList.remove("is-scrolling");
    };
  }, []);

  // 当外部传入 initialMemberId 时，若当前未指定 member 则自动对其匹配初始化
  useEffect(() => {
    if (initialMemberId && (!currentMember || currentMember.id !== initialMemberId)) {
      if (members.length > 0) {
        const found = members.find((m) => m.id === initialMemberId || m.memberId === initialMemberId);
        if (found) {
          setCurrentMemberId(found.id);
        }
      }
    }
  }, [initialMemberId, members, currentMember, setCurrentMemberId]);

  const fetchDetail = () => {
    if (!currentMember) return;
    fetch(`/api/members/${currentMember.id}`)
      .then((res) => res.json())
      .then(setDetail);
  };

  useEffect(() => {
    if (!currentMember) return;
    fetchDetail();

    fetch(`/api/qrcode?memberId=${currentMember.memberId}`)
      .then((res) => res.json())
      .then((data) => setQrCode(data.qrDataUrl));
      
    fetch(`/api/events`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLiveEventsCount(data.length);
        }
      })
      .catch(() => setLiveEventsCount(0));

    // 生日检查逻辑
    if (currentMember.birthday) {
      const today = new Date();
      const bday = new Date(currentMember.birthday);
      
      if (today.getMonth() === bday.getMonth() && today.getDate() === bday.getDate()) {
        const yearKey = `jbs_bday_${currentMember.id}_${today.getFullYear()}`;
        const hasClaimed = localStorage.getItem(yearKey);
        
        if (!hasClaimed) {
          setShowBirthdayConfetti(true);
          
          // 给用户加 2 分
          fetch(`/api/members/${currentMember.id}/birthday-bonus`, { method: "POST" })
            .then(res => res.json())
            .then(() => {
              localStorage.setItem(yearKey, "true");
              refreshMembers(); // Refresh global score
              fetchDetail(); // Refresh history timeline
            })
            .catch(console.error);
        }
      }
    }
  }, [currentMember]);

  // 计算会员当前修持等级称号
  const memberLevelTitle = useMemo(() => {
    if (!currentMember) return "初发心菩萨";
    const pts = currentMember.totalPoints;
    for (let i = DHARMA_LEVELS.length - 1; i >= 0; i--) {
      if (pts >= DHARMA_LEVELS[i].minPoints) {
        return `${DHARMA_LEVELS[i].badge} ${DHARMA_LEVELS[i].title}`;
      }
    }
    return "🌱 初发心菩萨";
  }, [currentMember]);

  const handleAvatarClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    fileInputRef.current?.click();
  };

  // 客户端图像智能无损/高清压缩，兼容任意超大分辨率和手机照片格式 (HEIC/PNG/JPG/WebP)
  const compressImageToDataUrl = (file: File, maxDim = 384, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentMember) return;

    setUploading(true);
    setUploadMsg("正在处理并上传新头像...");

    try {
      // 1. 客户端秒级压缩优化
      const compressedDataUrl = await compressImageToDataUrl(file, 384, 0.82);

      if (!compressedDataUrl) {
        throw new Error("图片读取失败");
      }

      // 2. 发送至服务器更新
      const res = await fetch(`/api/members/${currentMember.id}/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoData: compressedDataUrl,
          ext: "jpg",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        await refreshMembers();
        sonnerToast.success("头像更新成功！", {
          description: "全新庄严相貌已保存并实时展现。",
          icon: "🪷",
        });
        setUploadMsg("头像已更新！");
        setTimeout(() => setUploadMsg(null), 3000);
      } else {
        sonnerToast.error(data.error || "上传失败");
        setUploadMsg(null);
      }
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      sonnerToast.error(err?.message || "上传失败，请稍后重试");
      setUploadMsg(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 会员主动扫描二维码（活动码或签到码）
  const handleScan = async (decodedText: string) => {
    setShowScanner(false);
    if (!currentMember) return;

    try {
      const eventName = decodedText.startsWith("EVENT:")
        ? decodedText.replace("EVENT:", "")
        : decodedText || "佛学会常规共修活动";

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: currentMember.id,
          eventName: eventName,
          pointsEarned: 5,
        }),
      });

      if (res.ok) {
        await refreshMembers();
        fetchDetail();
        setToast({
          memberName: currentMember.name,
          memberId: currentMember.memberId,
          pointsEarned: 5,
        });
        setToastVisible(true);
      } else {
        alert("签到失败或该活动已完成签到");
      }
    } catch {
      alert("扫码签到遇到网络异常");
    }
  };

  // 数据加载中状态：渲染高保真卡片与布局骨架屏（SSR 保证），杜绝整页空白
  if (loading && !currentMember) {
    return (
      <>
        <KaresansuiBackground />
        <MemberCardSkeleton />
      </>
    );
  }

  // 无会员数据状态
  if (!currentMember) {
    return (
      <>
        <KaresansuiBackground />
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          title="暂无会员数据"
          description="请先添加会员或运行数据库种子脚本"
        />
      </>
    );
  }

  const attendanceCount = detail?.attendances.length ?? 0;
  const redemptionCount = detail?.redemptions.length ?? 0;

  return (
    <>
      {/* ── 枯山水沙地底层（Canvas 固定全屏，z-index: -1） ── */}
      <KaresansuiBackground />



      {showBirthdayConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <Confetti 
            width={windowSize.width || 800} 
            height={windowSize.height || 600} 
            recycle={false} 
            numberOfPieces={400} 
            colors={['#c9a227', '#b8860b', '#e8c872', '#faf7f2']} 
            gravity={0.15}
            onConfettiComplete={() => setShowBirthdayConfetti(false)}
          />
        </div>
      )}

      {/* 生日祝福弹窗 */}
      <AnimatePresence>
        {showBirthdayConfetti && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white p-8 shadow-2xl text-center max-w-sm w-full border border-golden-deep/30 dark:bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-br from-golden-deep/10 to-transparent pointer-events-none" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-golden-deep/10 text-4xl">
                🎂
              </div>
              <h3 className="text-xl font-bold text-golden-rich mb-2">祝您福寿安康！</h3>
              <p className="text-sm text-charcoal/80 dark:text-slate-300 mb-6">
                佛学会为您送上 <span className="font-bold text-jade">2</span> 个生辰福气积分。愿您福慧双增，法喜充满。
              </p>
              <button 
                onClick={() => setShowBirthdayConfetti(false)}
                className="w-full rounded-xl bg-gradient-to-r from-golden-deep to-golden-rich py-3 font-bold text-white shadow-md transition-transform active:scale-95"
              >
                感恩接受
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 会员信息卡 (3D 景深 + 鎏金流光边框 + GPU 独立合成层加速) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-8 will-change-transform transform-gpu"
        style={{ transform: "translateZ(0)" }}
      >
        <Card3D intensity={8} glow={true}>
          <GoldShimmerBorder glowOpacity={0.85}>
            <div className="relative p-6 sm:p-8 overflow-hidden rounded-[22px] bg-[#FAF8F5]/92 md:bg-gradient-to-br md:from-amber-50/60 md:via-warm-cream/70 md:to-amber-100/40">
              {/* ── 金色脉冲微光呼吸层 (仅桌面端启用，移动端隐藏避免昂贵的高斯模糊连续重绘) ── */}
              <motion.div
                animate={{
                  opacity: [0.25, 0.45, 0.25],
                  scale: [1, 1.06, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="pointer-events-none absolute -inset-10 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.35)_0%,rgba(245,158,11,0.15)_45%,transparent_70%)] blur-2xl hidden md:block"
              />

              <div className="absolute -right-8 -top-8 h-40 w-40 opacity-[0.06]">
                <Image src="/logo.png" alt="" fill className="object-contain" />
              </div>

              <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                {/* 头像 + 更换照片按钮 */}
                <div className="flex flex-col items-center sm:items-start shrink-0">
                  <div
                    className="relative group cursor-pointer select-none rounded-full"
                    onClick={handleAvatarClick}
                    title="点击更换头像相片"
                  >
                    <MemberAvatar
                      name={currentMember.name}
                      photo={currentMember.photo}
                      size="lg"
                    />

                    {/* 相机微光悬浮层 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-xs">
                      {uploading ? (
                        <svg className="h-7 w-7 animate-spin text-amber-300" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                      ) : (
                        <>
                          <Camera className="h-6 w-6 text-white drop-shadow" />
                          <span className="mt-1 text-[10px] font-bold text-white tracking-wider">更换相片</span>
                        </>
                      )}
                    </div>

                    {/* 始终可见的小相机角标 (右下角发光徽章) */}
                    <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-golden-deep text-white shadow-md border-2 border-white transition-transform group-hover:scale-110">
                      <Camera className="h-3.5 w-3.5" />
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h3 className="text-2xl font-bold text-charcoal dark:text-white">
                      {currentMember.name}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-200 to-amber-400 px-2.5 py-0.5 text-xs font-black text-amber-950 shadow-sm border border-amber-300">
                        {memberLevelTitle}
                      </span>
                      {currentMember.role === "理事" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 text-xs font-black text-amber-900 dark:text-amber-200 shadow-sm">
                          <span>🪷</span> 理事
                        </span>
                      )}
                      {currentMember.role === "学长姐" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-xs font-black text-indigo-900 dark:text-indigo-200 shadow-sm">
                          <span>🏮</span> 学长姐
                        </span>
                      )}
                      {(!currentMember.role || currentMember.role === "学员") && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-black text-emerald-900 dark:text-emerald-200 shadow-sm">
                          <span>🌱</span> 学员
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted dark:text-slate-400">{currentMember.email}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge variant="golden">{currentMember.memberId}</Badge>
                    <Badge variant={currentMember.role === "理事" ? "carmine" : currentMember.role === "学长姐" ? "golden" : "jade"}>
                      {currentMember.role === "理事" ? "🪷 护持理事" : currentMember.role === "学长姐" ? "🏮 资深学长姐" : "🌱 佛学社员"}
                    </Badge>
                    <Badge variant="jade">活跃会员</Badge>
                  </div>
                  <AnimatePresence>
                    {uploadMsg && (
                      <motion.p
                        key="upload-msg"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 text-xs text-jade font-medium"
                      >
                        {uploadMsg}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <p className="mt-1 text-[10px] text-muted/60 dark:text-slate-400/60">点击头像更换照片</p>
                </div>

                {/* ── 功德菩提树（积分可视化） ── */}
                <div className="flex flex-col items-center">
                  <p className="mb-1 text-xs font-bold text-amber-950/80">累积积分</p>
                  <LivingBodhiTree
                    points={currentMember.totalPoints}
                    size="sm"
                  />
                </div>

                {/* 会员二维码（点击放大与下载） */}
                {qrCode && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="group relative cursor-pointer"
                      onClick={() => setIsQrModalOpen(true)}
                      title="点击放大与下载 PDF"
                    >
                      <img
                        src={qrCode}
                        alt="会员二维码"
                        className="h-28 w-28 rounded-2xl ring-2 ring-amber-400/50 shadow-md transition-shadow group-hover:shadow-lg group-hover:ring-amber-600 bg-white p-1"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-charcoal/50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100 text-white">
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                        </svg>
                        <span className="text-[10px] font-bold mt-1">放大/下载</span>
                      </div>
                    </motion.div>
                    <button
                      onClick={() => setIsQrModalOpen(true)}
                      className="mt-2 text-[11px] font-bold text-amber-950/80 hover:text-amber-950 hover:underline"
                    >
                      🔍 放大 / 存为PDF
                    </button>
                  </div>
                )}
              </div>

              {/* ── 底部耀眼钻石星芒光棱特效 (Lens Flare Starburst) ── */}
              <div
                className="pointer-events-none absolute bottom-0 left-[51%] -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center"
                style={{ width: "120px", height: "120px" }}
                aria-hidden="true"
              >
                {/* 柔和径向暖金光晕 */}
                <div
                  className="absolute w-24 h-24 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 240, 180, 0.85) 0%, rgba(245, 158, 11, 0.45) 45%, transparent 70%)",
                  }}
                />

                {/* 纵向向上激射的光柱（直插卡片内部） */}
                <div
                  className="absolute -top-7 w-[3px] h-20 bg-gradient-to-t from-white via-amber-200 to-transparent rounded-full opacity-90 blur-[0.5px]"
                  style={{
                    boxShadow: "0 0 12px 2px rgba(255, 235, 150, 0.8)",
                  }}
                />

                {/* 纵向尖锐白金光束 */}
                <div
                  className="absolute w-[2px] h-16 bg-gradient-to-b from-transparent via-white to-transparent"
                  style={{
                    boxShadow: "0 0 8px 1px rgba(255, 255, 255, 0.9)",
                  }}
                />

                {/* 水平展开的横向光翼 */}
                <div
                  className="absolute h-[2px] w-20 bg-gradient-to-r from-transparent via-white to-transparent"
                  style={{
                    boxShadow: "0 0 8px 1px rgba(255, 240, 180, 0.9)",
                  }}
                />

                {/* 45度角菱形星芒 (4-point Diamond Star) */}
                <div
                  className="absolute w-7 h-7 rotate-45 border border-white/60 bg-white/20 blur-[0.5px]"
                  style={{
                    boxShadow: "0 0 10px 2px rgba(255, 215, 0, 0.7)",
                  }}
                />

                {/* 耀眼爆闪纯白核心（自带优雅呼吸微光，只动 scale/opacity） */}
                <motion.div
                  animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="shimmer-sweep relative w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_3px_#ffffff,0_0_20px_6px_#fbbf24,0_0_35px_10px_#d97706]"
                  style={{ willChange: "transform, opacity" }}
                />
              </div>
            </div>
          </GoldShimmerBorder>
        </Card3D>
      </motion.div>

      {/* 3D 交互仪表盘菜单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
      >
        <Dashboard3DMenu
          points={currentMember.totalPoints}
          attendanceCount={attendanceCount}
          liveEventsCount={liveEventsCount}
          registeredMembersCount={members.length}
          onOpenScan={() => setShowScanner(true)}
        />
      </motion.div>

      {/* 每日菩提法语 3D 抽签 */}
      <motion.div
        id="dharma-section"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: "easeOut" }}
      >
        <DailyDharmaCard />
      </motion.div>

      {/* 视图切换 Tabs (3 栏切换) */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex rounded-2xl bg-[#FAF8F5] dark:bg-slate-800 md:bg-white/70 md:dark:bg-slate-800/80 p-1.5 shadow-sm border border-ocher/20 dark:border-white/10 md:backdrop-blur-md">
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "history"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            个人出勤与兑换
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "leaderboard"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <span>🏆</span>
            精进积分榜
          </button>

          <button
            onClick={() => setActiveTab("badges")}
            className={`flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "badges"
                ? "bg-golden-deep text-white shadow-md"
                : "text-muted dark:text-slate-400 hover:text-charcoal dark:hover:text-white"
            }`}
          >
            <span>🎖️</span>
            修持勋章馆
          </button>
        </div>
      </div>

      {/* 切换展示区域 */}
      <AnimatePresence mode="wait">
        {activeTab === "history" && (
          <motion.div
            key="history-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card>
              <h4 className="mb-6 text-lg font-semibold text-charcoal dark:text-white">出勤与兑换时间轴</h4>
              <TimelineView 
                attendances={detail?.attendances || []} 
                redemptions={detail?.redemptions || []} 
              />
            </Card>
          </motion.div>
        )}

        {activeTab === "leaderboard" && (
          <motion.div
            key="leaderboard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <Leaderboard members={members} currentMemberId={currentMember?.id} />
            </Card>
          </motion.div>
        )}

        {activeTab === "badges" && (
          <motion.div
            key="badges-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <DharmaBadges
              member={currentMember}
              attendanceCount={attendanceCount}
              redemptionCount={redemptionCount}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 二维码高清放大 & PDF 下载弹窗 */}
      <QRModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        qrCodeUrl={qrCode}
        memberName={currentMember?.name || ""}
        memberId={currentMember?.memberId || ""}
        totalPoints={currentMember?.totalPoints || 0}
      />

      {/* 扫一扫相机弹窗 */}
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      {/* 签到成功 Spring 气泡 */}
      {toast && (
        <CheckInToast
          memberName={toast.memberName}
          memberId={toast.memberId}
          pointsEarned={toast.pointsEarned}
          visible={toastVisible}
          onDismiss={() => {
            setToastVisible(false);
            setTimeout(() => setToast(null), 400);
          }}
        />
      )}
      
      {/* 供灯祈福入口按钮 */}
      <LiquidOrbButton onClick={() => setShowLotusCanvas(true)} />

      {/* 供灯祈福全屏 3D 模态框 */}
      <AnimatePresence>
        {showLotusCanvas && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          >
            <div className="relative w-full h-full sm:w-[95vw] sm:max-w-5xl sm:h-[85vh] overflow-hidden rounded-none sm:rounded-3xl border-0 sm:border border-golden-deep/40 shadow-[0_0_50px_rgba(201,162,39,0.15)] bg-[#050505]">
              {/* 右上角关闭按钮（带清晰退出标签与点击区域） */}
              <button
                type="button"
                onClick={() => setShowLotusCanvas(false)}
                className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-50 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-carmine/80 hover:text-white cursor-pointer border border-white/20 shadow-lg active:scale-95"
                title="退出供灯"
                aria-label="退出供灯"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs">退出</span>
              </button>

              {/* 环境提示文本 */}
              <div className="absolute left-1/2 top-[calc(1.1rem+env(safe-area-inset-top,0px))] z-40 -translate-x-1/2 rounded-full bg-black/50 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs tracking-wider sm:tracking-widest text-golden-rich backdrop-blur-md max-w-[calc(100vw-12rem)] truncate sm:max-w-none pointer-events-none">
                双击水面缩放 · 点击心灯功德+1
              </div>

              <LotusSeaCanvas 
                currentUserId={currentMember?.id || "user-me"}
                currentUserName={currentMember?.name ?? "同修"}
                currentUserRole={(currentMember?.role as any) || "学员"}
                maxLampsPerUser={1}
                onClose={() => setShowLotusCanvas(false)}
                onPlaceLamp={() => sonnerToast.success("已供上一盏心灯", { icon: "🪷" })}
                onDedicate={() => sonnerToast.success("功德已回向", { icon: "✨" })}
                onLimitReached={() => sonnerToast.warning("每位同修仅限供奉一盏莲灯", { duration: 4000 })}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部安全留白：确保内容不被壁纸层遮挡 */}
      <div className="h-32 sm:h-16 pointer-events-none" aria-hidden="true" />
    </>
  );
}
