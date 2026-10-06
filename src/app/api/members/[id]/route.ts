import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      attendances: { orderBy: { dateTime: "desc" }, take: 20 },
      redemptions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { reward: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "会员不存在" }, { status: 404 });
  }

  return NextResponse.json(member);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // 1. 管理员通行码鉴权
  const { isValid, errorResponse } = (await import("@/lib/adminAuth")).verifyAdminPin(request);
  if (!isValid && errorResponse) {
    return errorResponse;
  }

  try {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "会员档案不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { name, email, birthday, role } = body;

    const updateData: {
      name?: string;
      email?: string;
      birthday?: Date | null;
      role?: string;
    } = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== member.email) {
        const existing = await prisma.member.findFirst({
          where: { email: normalizedEmail, id: { not: member.id } },
        });
        if (existing) {
          return NextResponse.json({ error: "该邮箱已被其他会员使用" }, { status: 409 });
        }
        updateData.email = normalizedEmail;
      }
    }

    if (birthday !== undefined) {
      if (birthday === null || birthday === "") {
        updateData.birthday = null;
      } else {
        const parsedDate = new Date(birthday);
        if (!isNaN(parsedDate.getTime())) {
          updateData.birthday = parsedDate;
        }
      }
    }

    if (typeof role === "string" && ["理事", "学长姐", "学员"].includes(role.trim())) {
      updateData.role = role.trim();
    }

    const updatedMember = await prisma.member.update({
      where: { id: member.id },
      data: updateData,
    });

    // 如果绑定了 User 登录账户，同步更新 User 表
    if (member.userId) {
      const userUpdate: any = {};
      if (updateData.name) userUpdate.name = updateData.name;
      if (updateData.email) userUpdate.email = updateData.email;
      if (updateData.birthday !== undefined) userUpdate.birthday = updateData.birthday;
      if (updateData.role) userUpdate.role = updateData.role;

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: member.userId },
          data: userUpdate,
        }).catch((err) => console.warn("Failed to sync user table:", err));
      }
    }

    return NextResponse.json(updatedMember);
  } catch (error: any) {
    console.error("[Update Member Error]", error);
    return NextResponse.json(
      { error: error?.message || "更新会员档案失败" },
      { status: 500 }
    );
  }
}

