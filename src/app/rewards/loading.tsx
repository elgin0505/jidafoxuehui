import { PageHeader, Skeleton } from "@/components/ui";
import { PageWrapper } from "@/components/PageWrapper";

export default function RewardsLoading() {
  return (
    <PageWrapper page="rewards">
      <PageHeader
        title="积分商城"
        subtitle="以修持功德兑换纪念礼品与结缘法宝"
      />

      {/* 会员积分条骨架屏 */}
      <div className="mb-8 overflow-hidden rounded-2xl border border-golden-deep/20 bg-warm-white/80 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton variant="text" width="120px" height="20px" className="rounded" />
            <Skeleton variant="text" width="180px" height="14px" className="rounded" />
          </div>
          <Skeleton variant="rect" width="80px" height="36px" className="rounded-xl" />
        </div>
      </div>

      {/* 商城卡片网格骨架屏 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-2xl border border-ocher/20 bg-warm-white/90 p-4 shadow-sm"
          >
            <Skeleton variant="rect" width="100%" height="180px" className="rounded-xl mb-4" />
            <div className="space-y-2 mb-4">
              <Skeleton variant="text" width="80%" height="20px" className="rounded" />
              <Skeleton variant="text" width="100%" height="14px" className="rounded" />
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <Skeleton variant="text" width="60px" height="20px" className="rounded" />
              <Skeleton variant="rect" width="70px" height="32px" className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
