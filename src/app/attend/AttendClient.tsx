"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { checkinWithToken, type CheckinResult } from "./actions";
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight } from "lucide-react";
import { CelebrationCheckmark } from "@/components/CelebrationCheckmark";

export default function AttendClient({ token }: { token: string }) {
  const [status, setStatus] = useState<"loading" | "done">("loading");
  const [result, setResult] = useState<CheckinResult | null>(null);

  useEffect(() => {
    if (!token) {
      setResult({ success: false, message: "二维码参数缺失，请重新扫码。" });
      setStatus("done");
      return;
    }

    // 智能提取本地持久化的会员凭据作为后备保障
    let fallbackId: string | undefined;
    try {
      const authUser = localStorage.getItem("jbs_auth_user");
      if (authUser) {
        const parsed = JSON.parse(authUser);
        fallbackId = parsed.memberId || parsed.email || parsed.id;
      }
      if (!fallbackId) {
        fallbackId = localStorage.getItem("currentMemberId") || undefined;
      }
    } catch {}

    checkinWithToken(token, fallbackId)
      .then((res) => {
        setResult(res);
        setStatus("done");
      })
      .catch((err) => {
        console.error("Checkin error:", err);
        setResult({ success: false, message: "网络或服务端异常，请重试。" });
        setStatus("done");
      });
  }, [token]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FAF7F2] via-[#F6F1E5] to-[#F2EAE0]">
      <div className="w-full max-w-md rounded-3xl border border-ocher/30 bg-white/95 p-8 shadow-2xl backdrop-blur-md text-center">
        {/* 顶部禅意徽标 */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-golden-rich/10 border border-golden-rich/30 text-2xl shadow-sm">
          🪷
        </div>

        <h2 className="text-xl font-bold tracking-tight text-charcoal font-serif mb-2">
          技大佛学会 · 活动扫码签到
        </h2>

        {status === "loading" && (
          <div className="py-8 flex flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-ocher/20 border-t-golden-deep" />
            <p className="text-sm text-muted font-medium">正在校验动态凭证并核销…</p>
          </div>
        )}

        {status === "done" && result && (
          <div className="py-4 space-y-4">
            {result.success ? (
              <div className="space-y-3">
                <CelebrationCheckmark size={190} className="mx-auto my-1" />
                <h3 className="text-xl font-bold text-emerald-700">签到成功 · 法喜充满</h3>
                <p className="text-sm text-charcoal/80 leading-relaxed px-2 bg-emerald-50/50 rounded-xl py-3 border border-emerald-100">
                  {result.message}
                </p>
                {result.eventName && (
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-golden-deep bg-golden-rich/10 px-3 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{result.eventName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-amber-700">签到未完成</h3>
                <p className="text-sm text-muted leading-relaxed px-2 bg-amber-50/50 rounded-xl py-3 border border-amber-100">
                  {result.message}
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-ocher/20 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-golden-deep px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-golden-rich transition-all active:scale-98"
              >
                <span>前往会员仪表板查看积分</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="w-full inline-flex items-center justify-center rounded-xl border border-ocher/30 bg-warm-white/60 px-4 py-2 text-xs font-medium text-charcoal/70 hover:text-charcoal transition-colors"
              >
                返回佛学会首页
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
