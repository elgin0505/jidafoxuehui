"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, EmptyState } from "@/components/ui";
import { useMember } from "@/components/MemberContext";
import { PageWrapper } from "@/components/PageWrapper";
import { motion } from "framer-motion";
import { RewardsStore } from "@/components/RewardsStore";

import { getCachedRewards, setCachedRewards } from "@/lib/eventsCache";

interface Reward {
  id: string;
  name: string;
  pointsRequired: number;
  image: string | null;
  description: string | null;
  stock: number;
}

export default function RewardsPage() {
  const { currentMember, refreshMembers } = useMember();
  // ⚡ 0ms 秒开：优先读取已有的内存/会话缓存，首屏即时展示礼品卡片
  const [rewards, setRewards] = useState<Reward[]>(() => (getCachedRewards() as Reward[]) || []);
  const [loading, setLoading] = useState<boolean>(() => !getCachedRewards()?.length);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/rewards")
      .then((res) => res.json())
      .then((data) => {
        const rawList = Array.isArray(data) ? data : [];
        const seen = new Set<string>();
        const uniqueList: Reward[] = [];
        for (const item of rawList) {
          if (!seen.has(item.name)) {
            seen.add(item.name);
            uniqueList.push(item);
          }
        }
        if (isMounted && uniqueList.length > 0) {
          setRewards(uniqueList);
          setCachedRewards(uniqueList);
        }
      })
      .catch((err) => {
        console.error("Failed to load rewards:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRedeem = async (reward: Reward, quantity = 1) => {
    if (!currentMember) throw new Error("您尚未登录或选择身份");

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: currentMember.id,
        rewardId: reward.id,
        quantity,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "兑换失败，请稍后重试");
    }

    await refreshMembers();
    const updated = await fetch("/api/rewards").then((r) => r.json());
    setRewards(updated);
  };

  const handleBatchRedeem = async (items: Array<{ rewardId: string; quantity: number }>) => {
    if (!currentMember) throw new Error("您尚未登录或选择身份");

    const res = await fetch("/api/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memberId: currentMember.id,
        items,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "批量兑换失败，请稍后重试");
    }

    await refreshMembers();
    const updated = await fetch("/api/rewards").then((r) => r.json());
    setRewards(updated);
  };

  return (
    <PageWrapper page="rewards">
      <PageHeader
        title="积分商城"
        subtitle="使用功德积分兑换精美奖品，回馈您的修行与参与"
      />

      {currentMember && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card className="mb-6 flex items-center justify-between bg-gradient-to-r from-warm-white/95 via-warm-cream/90 to-ocher-light/40 border-2 border-golden-deep/35 shadow-md">
            <div>
              <p className="text-xs font-bold text-golden-rich uppercase tracking-wider">当前可用积分</p>
              <motion.p
                key={currentMember.totalPoints}
                initial={{ scale: 1.15, color: "#2d6a4f" }}
                animate={{ scale: 1, color: "#b8860b" }}
                transition={{ duration: 0.4 }}
                className="text-4xl font-extrabold text-golden-rich mt-1"
              >
                {currentMember.totalPoints}
              </motion.p>
            </div>
            <UnalomeDecoration />
          </Card>
        </motion.div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-80 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-xs border border-amber-300/20 animate-pulse p-5 flex flex-col justify-between"
            >
              <div className="h-40 w-full rounded-xl bg-amber-200/30 animate-pulse" />
              <div className="space-y-2 mt-4">
                <div className="h-5 w-32 rounded-lg bg-amber-200/50 animate-pulse" />
                <div className="h-3 w-48 rounded bg-amber-200/30 animate-pulse" />
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="h-6 w-16 rounded-full bg-amber-200/40 animate-pulse" />
                <div className="h-8 w-20 rounded-xl bg-amber-200/40 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : rewards.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 12v8H4v-8M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
            </svg>
          }
          title="暂无奖品"
          description="积分商城正在筹备中，精彩奖品即将上架"
        />
      ) : (
        <RewardsStore 
          rewards={rewards}
          userPoints={currentMember?.totalPoints || 0}
          onRedeem={handleRedeem}
          onBatchRedeem={handleBatchRedeem}
        />
      )}
    </PageWrapper>
  );
}

function UnalomeDecoration() {
  return (
    <svg className="h-12 w-12 text-golden-deep/20" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M24 42V28c0-4 4-6 4-10 0-3-2-5-4-6-2 1-4 3-4 6 0 4 4 6 4 10v14" />
      <path d="M24 8c-2 0-4 1.5-4 3.5" />
      <circle cx="24" cy="6" r="2" fill="currentColor" />
    </svg>
  );
}
