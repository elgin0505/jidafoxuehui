import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { syncUserToGoogleSheet } from "@/lib/googleSheetsSync";
import { createSessionToken } from "@/lib/auth";

/**
 * 临时数据库网络抖动 / 连接池冷启动重试辅助函数
 */
async function withDbRetry<T>(operation: () => Promise<T>, maxRetries = 2, delayMs = 600): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: any) {
      lastError = err;
      const isTransientConnectionError =
        err?.code === "P1001" ||
        err?.message?.includes("Can't reach database server") ||
        err?.message?.includes("connection pool") ||
        err?.message?.includes("timeout");

      if (isTransientConnectionError && attempt < maxRetries - 1) {
        console.warn(`[DB Retry] 遇到数据库暂时连接抖动，等待 ${delayMs}ms 后重试 (尝试 ${attempt + 1}/${maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

/**
 * 安全生成下一个会员编号 (例如 FXH0001, FXH0002)
 * 遍历现有 memberId 取最大数值并递增，避免 count() 在高并发下生成重复编号
 */
async function generateNextMemberId(): Promise<string> {
  const members = await withDbRetry(() =>
    prisma.member.findMany({
      select: { memberId: true },
    })
  );

  let maxNum = 0;
  for (const m of members) {
    const match = m.memberId.match(/FXH(\d+)/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `FXH${String(nextNum).padStart(4, "0")}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, birthday, role } = body;

    const validRoles = ["理事", "学员", "学长姐"];
    const userRole = typeof role === "string" && validRoles.includes(role.trim()) ? role.trim() : "学员";

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "姓名、邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码长度至少为 6 个字符" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. 检查邮箱是否已存在 (配合连接重试机制避免冷启动失败)
    const existingUser = await withDbRetry(() =>
      prisma.user.findUnique({
        where: { email: normalizedEmail },
      })
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 2. 加密密码 (统一安全强度 Salt 12)
    const passwordHash = await bcrypt.hash(password, 12);
    const parsedBirthday = birthday ? new Date(birthday) : null;

    // 3. 创建独立 User 登录账户
    const user = await withDbRetry(() =>
      prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          birthday: parsedBirthday,
          role: userRole,
        },
      })
    );

    // 4. 创建关联的 Member 会员档案，附带自愈重试机制
    let member = null;
    let attempts = 0;
    while (!member && attempts < 3) {
      try {
        const memberId = await generateNextMemberId();
        member = await withDbRetry(() =>
          prisma.member.create({
            data: {
              memberId,
              name: name.trim(),
              email: normalizedEmail,
              birthday: parsedBirthday,
              role: userRole,
              totalPoints: 0,
              userId: user.id,
            },
          })
        );
      } catch (err: any) {
        attempts++;
        if (attempts >= 3) throw err;
      }
    }

    if (!member) {
      throw new Error("无法分配会员编号，请稍后重试");
    }

    // 5. 安全调用 Google Sheets 同步逻辑 (异步非阻塞，内部有异常捕获)
    syncUserToGoogleSheet({
      memberId: member.memberId,
      memberCode: member.memberId,
      name: member.name,
      email: member.email,
      birthday: member.birthday,
      createdAt: member.createdAt,
      totalPoints: member.totalPoints,
    }).catch((e) => console.error("Google Sheets syncUser error:", e));

    // 6. 生成 7 天有效期的真实 JWT Session Token
    const token = createSessionToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      memberId: member.id,
      memberCode: member.memberId,
      role: userRole,
    });

    const response = NextResponse.json(
      {
        message: "注册成功",
        token,
        id: user.id,
        name: user.name,
        email: user.email,
        role: userRole,
        memberId: member.id,
        memberCode: member.memberId,
      },
      { status: 201 }
    );

    // 7. 设置 HTTP-only 安全 Cookie
    response.cookies.set("jbs_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("注册 API 发生严重错误:", error);

    const isDbConnectionError =
      error?.code === "P1001" ||
      error?.message?.includes("Can't reach database server") ||
      error?.message?.includes("database server is running") ||
      error?.message?.includes("invocation");

    const userFriendlyError = isDbConnectionError
      ? "数据库连接繁忙或服务正在唤醒中，请稍候几秒后重新点击创建"
      : (error?.message && !error.message.includes("prisma") && !error.message.includes("invocation") && !error.message.includes("database server")
          ? error.message
          : "注册失败，请稍后重试");

    return NextResponse.json(
      { error: userFriendlyError },
      { status: 500 }
    );
  }
}
