import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

/**
 * GET /api/lamps
 * 获取所有莲灯列表
 */
export async function GET() {
  try {
    const lamps = await prisma.lamp.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(lamps);
  } catch (error) {
    console.error("[Lamps GET Error]", error);
    return NextResponse.json(
      { error: "获取莲灯列表失败" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lamps
 * 供奉新莲灯
 * 模块二要求：后端校验，先执行 prisma.lamp.findFirst({ where: { userId } })，若有记录直接返回 400 错误
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const session = getAuthSession(request);
    
    // 优先从 body 或 session 中提取 userId
    const rawUserId = body.userId || session?.userId;
    if (!rawUserId || typeof rawUserId !== "string" || !rawUserId.trim()) {
      return NextResponse.json(
        { error: "缺少同修身份标识 (userId)" },
        { status: 400 }
      );
    }
    const userId = rawUserId.trim();
    const userName = (typeof body.userName === "string" && body.userName.trim()) || session?.name || "同修";

    // 后端强校验：单人单灯限制（按 userId 与真实姓名双重排重）
    const existingLamp = await prisma.lamp.findFirst({
      where: {
        OR: [
          { userId },
          ...(userName && userName !== "同修" ? [{ userName }] : []),
        ],
      },
    });

    if (existingLamp) {
      return NextResponse.json(
        { error: `同修【${existingLamp.userName}】已供奉过一盏莲灯，每位同修仅限供奉一盏` },
        { status: 400 }
      );
    }
    const posX = Number.isFinite(body.posX)
      ? Number(body.posX)
      : (Array.isArray(body.position) && Number.isFinite(body.position[0]) ? Number(body.position[0]) : 0);
    const posY = Number.isFinite(body.posY)
      ? Number(body.posY)
      : (Array.isArray(body.position) && Number.isFinite(body.position[1]) ? Number(body.position[1]) : 0);
    const posZ = Number.isFinite(body.posZ)
      ? Number(body.posZ)
      : (Array.isArray(body.position) && Number.isFinite(body.position[2]) ? Number(body.position[2]) : 0);
    const message = (typeof body.message === "string" && body.message.trim().slice(0, 100)) || "愿平安吉祥";

    // 边界与权限校验：计算放灯离道场中心的水平距离
    const distance = Math.hypot(posX, posZ);
    if (distance > 30) {
      return NextResponse.json(
        { error: "请在莲花道场结界内供奉心灯（距离中心 30 以内）" },
        { status: 400 }
      );
    }

    // 内圈限制：距离中心 < 8 为光环内圈，仅限理事与学长姐供奉
    if (distance < 8) {
      const member = await prisma.member.findFirst({
        where: { OR: [{ id: userId }, { userId: userId }] },
      });
      const user = !member
        ? await prisma.user.findUnique({ where: { id: userId } })
        : null;
      const role = member?.role || user?.role || session?.role || "学员";
      const isInnerAllowed =
        role === "理事" ||
        role === "学长姐" ||
        role === "admin" ||
        role === "committee" ||
        role === "presidency";

      if (!isInnerAllowed) {
        return NextResponse.json(
          { error: "莲花灯光环内圈仅限理事和学长姐供奉莲花，学员请在光环外圈供灯" },
          { status: 403 }
        );
      }
    }

    const newLamp = await prisma.lamp.create({
      data: {
        userId,
        userName,
        posX,
        posY,
        posZ,
        message,
        prayerCount: 0,
      },
    });

    return NextResponse.json(newLamp, { status: 201 });
  } catch (error) {
    console.error("[Lamps POST Error]", error);
    return NextResponse.json(
      { error: "供奉莲灯失败，请稍后重试" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lamps
 * 清空道场 (Reset Action)
 * 模块二要求：调用 API 执行 prisma.lamp.deleteMany({})
 */
export async function DELETE(request: Request) {
  try {
    const result = await prisma.lamp.deleteMany({});
    return NextResponse.json({
      success: true,
      message: "道场已清空重置",
      count: result.count,
    });
  } catch (error) {
    console.error("[Lamps DELETE Error]", error);
    return NextResponse.json(
      { error: "清空道场失败" },
      { status: 500 }
    );
  }
}
