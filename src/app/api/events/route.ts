import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncEventsFromGoogleSheet } from "@/lib/googleSheets";
import { verifyAdminPin } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const forceSync = searchParams.get("sync") === "true";

  try {
    // 1. 强制同步模式（管理员手动刷新或 Webhook 触发）
    if (forceSync) {
      const syncedEvents = await syncEventsFromGoogleSheet(true);
      return NextResponse.json(syncedEvents, {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    // 2. ⚡ 极速快读路径：优先从本地数据库直读，耗时 ~20-50ms，彻底消除 13 秒的同步阻塞
    const dbEvents = await prisma.event.findMany({
      orderBy: { dateTime: "asc" },
    });

    // 3. 本地数据库为空时兜底冷启动同步
    if (dbEvents.length === 0) {
      const syncedEvents = await syncEventsFromGoogleSheet(false);
      return NextResponse.json(syncedEvents, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
        },
      });
    }

    // 4. 非阻塞后台静默刷新：不阻塞当前用户的响应
    syncEventsFromGoogleSheet(false).catch((err) => {
      console.warn("Background events sync notice:", err?.message || err);
    });

    // 5. 立即秒级返回数据，并附加 Vercel Edge CDN 缓存头
    return NextResponse.json(dbEvents, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    try {
      const fallbackEvents = await prisma.event.findMany({
        orderBy: { dateTime: "asc" },
      });
      return NextResponse.json(fallbackEvents, {
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
  // 1. 安全校验：验证管理员权限
  const auth = verifyAdminPin(request);
  if (!auth.isValid && auth.errorResponse) {
    return auth.errorResponse;
  }

  const body = await request.json();
  const { name, description, dateTime, location, points = 1 } = body;

  if (!name || !dateTime) {
    return NextResponse.json(
      { error: "活动名称和日期为必填项" },
      { status: 400 }
    );
  }

  const event = await prisma.event.create({
    data: {
      name,
      description,
      dateTime: new Date(dateTime),
      location,
      points: Number(points) || 1,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
