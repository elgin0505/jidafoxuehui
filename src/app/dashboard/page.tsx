import { cookies } from "next/headers";
import { PageHeader } from "@/components/ui";
import { PageWrapper } from "@/components/PageWrapper";
import { verifySessionToken } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "会员仪表板 · 技大佛学会",
  description: "查看个人资料、修持境界、积分汇总与出勤记录",
};

export default async function DashboardPage() {
  let initialMemberId: string | undefined;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("jbs_session_token")?.value;
    if (token) {
      const session = verifySessionToken(token);
      if (session?.memberId) {
        initialMemberId = session.memberId;
      } else if (session?.userId) {
        initialMemberId = session.userId;
      }
    }
  } catch {
    // 静态预渲染阶段优雅回退
  }

  return (
    <PageWrapper page="dashboard">
      <PageHeader
        title="会员仪表板"
        subtitle="查看个人资料、修持境界、积分汇总与出勤记录"
      />
      <DashboardClient initialMemberId={initialMemberId} initialTab="history" />
    </PageWrapper>
  );
}
