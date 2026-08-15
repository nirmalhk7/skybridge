import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [userCount, agreementCount, roles, usersWithOccasions] = await Promise.all([
    prisma.user.count(),
    prisma.escrowAgreement.count(),
    prisma.user.groupBy({ by: ["role"], _count: { _all: true } }),
    prisma.user.findMany({ select: { occasions: true } }),
  ]);

  console.log(JSON.stringify({
    database: "skybridge-cluster",
    users: userCount,
    escrowAgreements: agreementCount,
    occasions: usersWithOccasions.reduce((total, user) => total + user.occasions.length, 0),
    roles: Object.fromEntries(roles.map(({ role, _count }) => [role, _count._all])),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
