import { PageHeader, Skeleton } from "@/components/ui";
import { PageWrapper } from "@/components/PageWrapper";

export default function EventsLoading() {
  return (
    <PageWrapper page="events">
      <PageHeader
        title="活动列表"
        subtitle="查看即将举行的佛学会活动，一键同步日历，参与活动获取功德积分"
      />

      {/* 日历交互卡片骨架屏 */}
      <div className="mb-12 overflow-hidden rounded-2xl border border-[#8A7A5E]/20 bg-gradient-to-br from-[#FAF7F2] via-[#F4EDE0] to-[#EFE5D0] p-6 shadow-[0_10px_30px_-12px_rgba(40,30,20,0.12)]">
        <div className="flex items-center justify-between mb-6">
          <Skeleton variant="text" width="160px" height="28px" className="rounded-lg" />
          <div className="flex gap-2">
            <Skeleton variant="rect" width="36px" height="36px" className="rounded-xl" />
            <Skeleton variant="rect" width="36px" height="36px" className="rounded-xl" />
          </div>
        </div>
        <Skeleton variant="rect" width="100%" height="260px" className="rounded-xl" />
      </div>

      {/* 分割线 */}
      <div className="relative my-10 flex items-center justify-center">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#8A7A5E]/25 to-transparent" />
        <span className="absolute bg-[#FAF7F2] px-4 text-xs font-serif text-[#8A7A5E] tracking-widest">
          法音宣流 · 盛事一览
        </span>
      </div>

      {/* 活动卡片网格骨架屏 */}
      <div className="grid gap-5 sm:grid-cols-2 mb-12">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[#8A7A5E]/20 bg-gradient-to-br from-[#FCFAF5] via-[#F9F4E8] to-[#F3EAD5] p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <Skeleton variant="rect" width="60px" height="60px" className="rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="70%" height="22px" className="rounded" />
                <Skeleton variant="text" width="40%" height="16px" className="rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton variant="text" width="100%" height="16px" className="rounded" />
              <Skeleton variant="text" width="85%" height="16px" className="rounded" />
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-[#8A7A5E]/15 pt-3.5">
              <Skeleton variant="text" width="80px" height="18px" className="rounded" />
              <Skeleton variant="rect" width="90px" height="32px" className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
