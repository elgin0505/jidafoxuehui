import { NextResponse } from "next/server";
import { prisma, recalculateMemberPoints } from "@/lib/prisma";
import { logRedemptionToGoogleSheet, syncRewardsFromGoogleSheet, updateRewardStockInGoogleSheet } from "@/lib/googleSheets";
import { requireAuth } from "@/lib/auth";
import { verifyAdminPin } from "@/lib/adminAuth";

export const revalidate = 60;

function deduplicateRewards(rewards: any[]) {
  const unique: any[] = [];
  const seen = new Set<string>();
  for (const r of (Array.isArray(rewards) ? rewards : [])) {
    if (r && r.name && !seen.has(r.name)) {
      seen.add(r.name);
      unique.push(r);
    }
  }
  return unique;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceSync = searchParams.get("sync") === "true";

  try {
    // 1. 强制同步模式（管理员手动刷新或 Webhook 触发）
    if (forceSync) {
      const syncedRewards = await syncRewardsFromGoogleSheet(true);
      return NextResponse.json(deduplicateRewards(syncedRewards), {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 2. ⚡ 极速快读路径：优先从本地数据库直读，耗时 ~20-50ms，彻底消除 8 秒的同步阻塞
    const dbRewards = await prisma.reward.findMany({
      orderBy: { pointsRequired: "asc" },
    });

    // 3. 本地数据库为空时兜底冷启动同步
    if (dbRewards.length === 0) {
      const syncedRewards = await syncRewardsFromGoogleSheet(false);
      return NextResponse.json(deduplicateRewards(syncedRewards), {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
        },
      });
    }

    // 4. 非阻塞后台静默刷新：不阻塞当前用户的响应
    syncRewardsFromGoogleSheet(false).catch((err) => {
      console.warn("Background rewards sync notice:", err?.message || err);
    });

    // 5. 立即秒级返回数据，并附加 Vercel Edge CDN 缓存头
    return NextResponse.json(deduplicateRewards(dbRewards), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to fetch rewards:", error);
    try {
      const fallbackRewards = await prisma.reward.findMany({
        orderBy: { pointsRequired: "asc" },
      });
      return NextResponse.json(deduplicateRewards(fallbackRewards), {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=86400",
        },
      });
    } catch {
      return NextResponse.json([]);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { memberId, rewardId, quantity, items } = body;

    if (!memberId) {
      return NextResponse.json(
        { error: "会员身份信息必填，请先登录" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });
    if (!member) {
      return NextResponse.json({ error: "会员不存在" }, { status: 404 });
    }

    // 0. 安全鉴权拦截：必须登录自身账号或具备管理员权限
    const adminAuth = verifyAdminPin(request);
    if (!adminAuth.isValid) {
      const { session, errorResponse } = requireAuth(request);
      if (errorResponse) return errorResponse;

      if (session?.memberId && session.memberId !== member.id && session.userId !== member.userId) {
        return NextResponse.json(
          { error: "越权操作拒绝：仅允许为已认证的本人账户兑换结缘品" },
          { status: 403 }
        );
      }
    }

    // 1. 规范化兑换清单 (支持单品选择数量 或 多选批量兑换)
    interface RedeemItemRequest {
      rewardId: string;
      quantity: number;
    }

    let itemsToProcess: RedeemItemRequest[] = [];

    if (Array.isArray(items) && items.length > 0) {
      itemsToProcess = items.map((it: any) => ({
        rewardId: String(it.rewardId),
        quantity: Math.max(1, parseInt(String(it.quantity || "1"), 10)),
      }));
    } else if (rewardId) {
      itemsToProcess = [
        {
          rewardId: String(rewardId),
          quantity: Math.max(1, parseInt(String(quantity || "1"), 10)),
        },
      ];
    } else {
      return NextResponse.json(
        { error: "请选择要兑换的法宝结缘品" },
        { status: 400 }
      );
    }

    // 2. 检查并计算所有奖品的库存与积分
    let totalPointsNeeded = 0;
    const validatedItems: {
      reward: any;
      quantity: number;
      pointsRequired: number;
    }[] = [];

    for (const itemReq of itemsToProcess) {
      const reward = await prisma.reward.findUnique({
        where: { id: itemReq.rewardId },
      });

      if (!reward) {
        return NextResponse.json(
          { error: `法宝ID [${itemReq.rewardId}] 不存在或已下架` },
          { status: 404 }
        );
      }

      if (reward.stock < itemReq.quantity) {
        return NextResponse.json(
          {
            error: `「${reward.name}」库存不足！当前仅剩 ${reward.stock} 件，无法兑换 ${itemReq.quantity} 件。`,
          },
          { status: 400 }
        );
      }

      const itemTotalPoints = reward.pointsRequired * itemReq.quantity;
      totalPointsNeeded += itemTotalPoints;

      validatedItems.push({
        reward,
        quantity: itemReq.quantity,
        pointsRequired: itemTotalPoints,
      });
    }

    // 3. 检查会员总积分是否充足
    if (member.totalPoints < totalPointsNeeded) {
      return NextResponse.json(
        {
          error: `当前积分不足！共需 ${totalPointsNeeded} 积分，您当前拥有 ${member.totalPoints} 积分。`,
        },
        { status: 400 }
      );
    }

    // 4. 执行数据库原子事务：扣减各法宝库存、扣减会员积分、创建兑换记录
    const transactionOps: any[] = [];

    for (const val of validatedItems) {
      // 创建兑换记录 (按数量记录或单笔总分)
      for (let q = 0; q < val.quantity; q++) {
        transactionOps.push(
          prisma.redemption.create({
            data: {
              memberId,
              rewardId: val.reward.id,
              pointsSpent: val.reward.pointsRequired,
            },
          })
        );
      }

      // 扣减数据库库存
      transactionOps.push(
        prisma.reward.update({
          where: { id: val.reward.id },
          data: { stock: { decrement: val.quantity } },
        })
      );
    }

    // 扣减会员总积分
    transactionOps.push(
      prisma.member.update({
        where: { id: memberId },
        data: { totalPoints: { decrement: totalPointsNeeded } },
      })
    );

    const txResults = await prisma.$transaction(transactionOps);
    const updatedMember = await recalculateMemberPoints(memberId);

    // 5. 异步同步到 Google Sheet：更新最新库存并写入 Redemptions 兑换记录
    const nowIso = new Date().toISOString();

    for (const val of validatedItems) {
      const newStock = Math.max(0, val.reward.stock - val.quantity);

      // 同步到 Google Sheet
      logRedemptionToGoogleSheet({
        memberId: member.memberId,
        memberName: member.name,
        rewardName: val.reward.name,
        pointsSpent: val.pointsRequired,
        quantity: val.quantity,
        newStock,
        timestamp: nowIso,
      }).catch((e) => console.error("Google Sheets sync redemption log error:", e));

      updateRewardStockInGoogleSheet(val.reward.name, newStock).catch((e) =>
        console.error("Google Sheets update stock error:", e)
      );
    }

    console.log(
      `✅ [Redeem API] 会员 ${member.name} (${member.memberId}) 成功兑换 ${validatedItems.length} 种法宝，共消耗 ${totalPointsNeeded} 积分`
    );

    return NextResponse.json(
      {
        success: true,
        message: "兑换成功！福慧增长，功德无量。",
        totalPointsSpent: totalPointsNeeded,
        remainingPoints: updatedMember.totalPoints,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ [Redeem API Error]:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "兑换失败，请稍后重试" },
      { status: 500 }
    );
  }
}
