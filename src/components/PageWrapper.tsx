import { ReactNode, ReactElement } from "react";
import Image from "next/image";

type PageTheme = "dashboard" | "events" | "rewards" | "admin";

interface PageWrapperProps {
  page: PageTheme;
  children: ReactNode;
}

// 仪表板：佛学会专属合照壁纸 + 曼陀罗光晕
function DashboardBg() {
  return (
    <div className="page-bg-dashboard" aria-hidden>
      {/* 佛学会专属合照大壁纸 (提高清晰度与色彩饱满度) */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/dashboard-wallpaper.jpg"
          alt="技大佛学会大家庭"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-60 sm:opacity-[0.52] filter saturate-[1.25] brightness-[1.03] scale-100"
        />
        {/* 细腻的半透明渐变，既让合照清晰，又衬托前景毛玻璃卡片 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 25%, rgba(250, 247, 242, 0.1) 0%, rgba(245, 237, 224, 0.35) 60%, rgba(240, 230, 214, 0.6) 100%)",
          }}
        />
      </div>

      {/* 曼陀罗放射线水印 */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.035]"
        width="700"
        height="700"
        viewBox="0 0 700 700"
        fill="none"
      >
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          const rad = (angle * Math.PI) / 180;
          const x2 = 350 + 320 * Math.cos(rad);
          const y2 = 350 + 320 * Math.sin(rad);
          return (
            <line
              key={i}
              x1="350"
              y1="350"
              x2={x2}
              y2={y2}
              stroke="#c9a227"
              strokeWidth="1"
            />
          );
        })}
        {[80, 150, 220, 290].map((r) => (
          <circle key={r} cx="350" cy="350" r={r} stroke="#c9a227" strokeWidth="0.8" fill="none" />
        ))}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <g key={i} transform={`rotate(${angle} 350 350)`}>
              <ellipse cx="350" cy="230" rx="28" ry="70" fill="#c9a227" opacity="0.6" />
            </g>
          );
        })}
        <circle cx="350" cy="350" r="32" fill="#c9a227" opacity="0.3" />
      </svg>
    </div>
  );
}

// 活动页：枯山水波纹 — 优雅弧线叠加
function EventsBg() {
  return (
    <div className="page-bg-events" aria-hidden>
      {/* 东方水墨日历壁纸底蕴：右上旭日晨光与温和波纹色带 */}
      <svg
        className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.06] pointer-events-none"
        viewBox="0 0 500 500"
        fill="none"
      >
        <circle cx="450" cy="50" r="160" fill="#C58B35" filter="blur(20px)" />
        <circle cx="450" cy="50" r="100" stroke="#B03A2E" strokeWidth="2" strokeDasharray="6 6" />
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 360) / 12;
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={450 + Math.cos(rad) * 90}
              y1={50 + Math.sin(rad) * 90}
              x2={450 + Math.cos(rad) * 130}
              y2={50 + Math.sin(rad) * 130}
              stroke="#C58B35"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* 底部流金律动水波纹 (呼应图二与枯山水) */}
      <svg
        className="absolute bottom-0 left-0 w-full opacity-[0.07] pointer-events-none"
        viewBox="0 0 1440 520"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <ellipse
            key={i}
            cx="720"
            cy={620 - i * 60}
            rx={340 + i * 60}
            ry={28 + i * 10}
            stroke="#8A7A5E"
            strokeWidth="1.2"
            fill="none"
          />
        ))}
        {/* 禅石 */}
        <ellipse cx="260" cy="480" rx="60" ry="18" fill="#5A7C59" opacity="0.3" />
        <ellipse cx="1180" cy="460" rx="44" ry="13" fill="#C58B35" opacity="0.35" />
      </svg>

      {/* 飘散竹叶与水墨禅韵 */}
      <svg
        className="absolute left-8 top-24 opacity-[0.06] pointer-events-none"
        width="200"
        height="240"
        viewBox="0 0 200 240"
        fill="none"
      >
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(${20 + i * 38}, ${i * 44}) rotate(${-30 + i * 18})`}>
            <ellipse cx="0" cy="0" rx="10" ry="32" fill="#3E5A44" />
            <line x1="0" y1="-32" x2="0" y2="32" stroke="#5A7C59" strokeWidth="0.8" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// 积分商城：星光 + 莲花花瓣飘散
function RewardsBg() {
  return (
    <div className="page-bg-rewards" aria-hidden>
      {/* 飘散莲花花瓣 */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {[
          { x: 120, y: 100, r: 30, angle: 15 },
          { x: 380, y: 60,  r: 20, angle: -20 },
          { x: 750, y: 130, r: 36, angle: 40 },
          { x: 1100, y: 80, r: 22, angle: -10 },
          { x: 1350, y: 200, r: 28, angle: 25 },
          { x: 200, y: 700, r: 24, angle: -30 },
          { x: 900, y: 780, r: 32, angle: 10 },
          { x: 1300, y: 680, r: 18, angle: 50 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.angle})`}>
            <ellipse cx="0" cy="0" rx={p.r * 0.4} ry={p.r} fill="#c9a227" />
            <ellipse cx="0" cy="0" rx={p.r * 0.4} ry={p.r} fill="#c9a227"
              transform="rotate(60)" />
            <ellipse cx="0" cy="0" rx={p.r * 0.4} ry={p.r} fill="#c9a227"
              transform="rotate(120)" />
          </g>
        ))}

        {/* 星光点 */}
        {[
          [480, 220], [620, 350], [880, 160], [1020, 440],
          [300, 500], [1200, 300], [700, 650], [100, 350],
        ].map(([x, y], i) => (
          <g key={`star-${i}`} transform={`translate(${x},${y})`}>
            <line x1="0" y1="-8" x2="0" y2="8" stroke="#b8860b" strokeWidth="1" />
            <line x1="-8" y1="0" x2="8" y2="0" stroke="#b8860b" strokeWidth="1" />
            <line x1="-5" y1="-5" x2="5" y2="5" stroke="#b8860b" strokeWidth="0.7" />
            <line x1="5" y1="-5" x2="-5" y2="5" stroke="#b8860b" strokeWidth="0.7" />
          </g>
        ))}
      </svg>
    </div>
  );
}

// 管理员：极简细格纹
function AdminBg() {
  return (
    <div className="page-bg-admin" aria-hidden>
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="admin-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2d6a4f" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#admin-grid)" />
      </svg>
    </div>
  );
}

const BgComponents: Record<PageTheme, () => ReactElement> = {
  dashboard: DashboardBg,
  events: EventsBg,
  rewards: RewardsBg,
  admin: AdminBg,
};

export function PageWrapper({ page, children }: PageWrapperProps) {
  const Bg = BgComponents[page];
  return (
    <div className="relative z-0 isolate min-h-full">
      <Bg />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
