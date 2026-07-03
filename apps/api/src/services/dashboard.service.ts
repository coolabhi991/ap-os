import prisma from "../config/prisma.js";

export async function getDashboard() {
  const company = await prisma.company.findFirst();

  const totalUsers = await prisma.user.count();

  const activeUsers = await prisma.user.count({
    where: {
      active: true,
    },
  });

  const inactiveUsers = await prisma.user.count({
    where: {
      active: false,
    },
  });

  return {
    company,
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
    },
    projects: {
      total: 0,
    },
    vendors: {
      total: 0,
    },
    clients: {
      total: 0,
    },
  };
}