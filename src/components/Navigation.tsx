"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "仪表板", fullLabel: "会员仪表板", icon: LotusIcon },
  { href: "/events", label: "活动", fullLabel: "活动列表", icon: CalendarIcon },
  { href: "/rewards", label: "商城", fullLabel: "积分商城", icon: GiftIcon },
  { href: "/admin/check-in", label: "管理", fullLabel: "管理控制台", icon: ScanIcon },
];

function handleLogout() {
  localStorage.removeItem("jbs_auth_user");
  localStorage.removeItem("currentMemberId");
  localStorage.removeItem("jbs_current_user_id");
  localStorage.removeItem("jbs_current_user_name");
  localStorage.removeItem("jbs_current_user_email");
  localStorage.removeItem("jbs_current_member_id");
  window.location.href = "/auth";
}

export function Navigation() {
  const pathname = usePathname();

  if (pathname === "/auth" || pathname === "/") return null;

  return (
    <>
      {/* ── 顶部品牌栏 ── */}
      <header className="sticky top-0 z-50 border-b border-ocher/20 bg-warm-white/90 backdrop-blur-md transition-colors duration-500">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-golden-deep/30 transition-all group-hover:ring-golden-deep/60">
              <Image src="/logo.png" alt="技大佛学会" fill className="object-cover" priority />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-charcoal">技大佛学会</h1>
              <p className="text-[10px] font-medium text-muted">出勤 · 积分 · 奖励</p>
            </div>
          </Link>

          {/* 桌面端横向导航 */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ href, fullLabel, icon: Icon }) => {
              const isActive = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-golden-deep/10 text-golden-rich"
                      : "text-muted hover:bg-ocher-light/30 hover:text-charcoal"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {fullLabel}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              title="退出登录"
              className="ml-2 flex items-center justify-center rounded-xl p-2 text-muted hover:bg-carmine/10 hover:text-carmine transition-all"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── 移动端固定底部导航栏 ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-stretch md:hidden"
        style={{
          background: "rgba(255, 252, 245, 0.97)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow: "0 -1px 0 rgba(201,162,39,0.18), 0 -8px 24px rgba(0,0,0,0.07)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="mobile-nav-item relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 select-none transition-colors"
              style={{ WebkitTapHighlightColor: "transparent", minHeight: "56px" }}
            >
              {/* 顶部激活线 */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-8 rounded-full bg-golden-deep" />
              )}
              <Icon
                className={`h-5 w-5 transition-all duration-200 ${
                  isActive ? "text-golden-rich scale-110" : "text-muted"
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
                  isActive ? "text-golden-rich" : "text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="mobile-nav-item relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 select-none transition-colors"
          style={{ WebkitTapHighlightColor: "transparent", minHeight: "56px" }}
        >
          <LogOut className="h-5 w-5 text-muted" />
          <span className="text-[10px] font-semibold tracking-wide text-muted">退出</span>
        </button>
      </nav>
    </>
  );
}

function LotusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 20c-4-2-7-5-7-9 0 0 3-2 7-2s7 2 7 2c0 4-3 7-7 9z" />
      <path d="M12 11c-2-1-3.5-3-3.5-5.5S10 3 12 3s3.5 1.5 3.5 3.5S14 10 12 11z" />
      <path d="M7 8c-1.5 1-2.5 2.5-2.5 4.5M17 8c1.5 1 2.5 2.5 2.5 4.5" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18M12 8c-2-3-4-3-4-1s2-2 4 0 4 2 4 1-2 0-4 1z" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
      <rect x="7" y="7" width="10" height="10" rx="1" />
    </svg>
  );
}
