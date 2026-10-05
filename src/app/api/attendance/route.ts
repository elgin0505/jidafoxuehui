import { NextResponse } from "next/server";
import { prisma, recalculateMemberPoints } from "@/lib/prisma";
import { logAttendanceToGoogleSheet } from "@/lib/googleSheets";
import { verifyAdminPin } from "@/lib/adminAuth";
import { getAuthSession } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  const logs = await prisma.attendanceLog.findMany({
    where: memberId ? { memberId } : undefined,
    orderBy: { dateTime: "desc" },
    include: {
      member: { select: { name: true, memberId: true } },
    },
    take: 50,
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  // 1. 安全校验：支持管理员通行码 (x-admin-pin) 或 已登录同修会话
  const adminAuth = verifyAdminPin(request);
  const session = !adminAuth.isValid ? getAuthSession(request) : null;

  if (!adminAuth.isValid && !session) {
    return (
      adminAuth.errorResponse ||
      NextResponse.json(
        { error: "未经授权的操作：请登录或提供管理员通行码" },
        { status: 401 }
      )
    );
  }

  const body = await request.json();
  const { memberId, eventName, pointsEarned = 1 } = body;

  if (!memberId || !eventName) {
    return NextResponse.json(
      { error: "会员ID和活动名称为必填项" },
      { status: 400 }
    );
  }

  let member = await prisma.member.findUnique({ where: { id: memberId } });

  if (!member) {
    member = await prisma.member.findUnique({
      where: { memberId: memberId },
    });
  }

  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  let finalPointsEarned = Number(pointsEarned) || 1;

  // 若非管理员操作，强制校验只能为登录本人签到，且积分由匹配活动设定
  if (!adminAuth.isValid && session) {
    const isSelf =
      member.id === session.userId ||
      member.userId === session.userId ||
      member.memberId === session.memberId ||
      member.email === session.email;

    if (!isSelf) {
      return NextResponse.json(
        { error: "权限受限：仅可为本人进行出勤签到" },
        { status: 403 }
      );
    }

    const matchedEvent = await prisma.event.findFirst({
      where: { name: eventName },
    });
    finalPointsEarned = matchedEvent?.points ?? 1;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 2. 幂等校验：防止同日重复签到
  const existing = await prisma.attendanceLog.findFirst({
    where: {
      memberId: member.id,
      eventName,
      dateTime: { gte: today, lt: tomorrow },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "该会员今日已签到此活动，无需重复签到" },
      { status: 409 }
    );
  }

  const log = await prisma.attendanceLog.create({
    data: {
      memberId: member.id,
      eventName,
      pointsEarned: finalPointsEarned,
    },
  });

  const updatedMember = await recalculateMemberPoints(member.id);

  // 3. 异步非阻塞同步到 Google Sheet
  logAttendanceToGoogleSheet({
    memberId: member.memberId,
    memberName: member.name,
    eventName,
    pointsEarned: finalPointsEarned,
    timestamp: log.dateTime.toISOString(),
  }).catch((err) => console.error("Google Sheets attendance sync error:", err));

  return NextResponse.json(
    { log, member: updatedMember },
    { status: 201 }
  );
}
