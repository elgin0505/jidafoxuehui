// @ts-ignore
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export async function recalculateMemberPoints(memberId: string) {
  const earned = await prisma.attendanceLog.aggregate({
    where: { memberId },
    _sum: { pointsEarned: true },
  });

  const spent = await prisma.redemption.aggregate({
    where: { memberId },
    _sum: { pointsSpent: true },
  });

  const totalPoints =
    (earned._sum.pointsEarned ?? 0) - (spent._sum.pointsSpent ?? 0);

  return prisma.member.update({
    where: { id: memberId },
    data: { totalPoints: Math.max(0, totalPoints) },
  });
}
