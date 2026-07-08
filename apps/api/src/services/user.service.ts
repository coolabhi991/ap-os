import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import prisma from "../config/prisma.js";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  companyId: string;
}

interface UpdateUserInput {
  name: string;
  email: string;
  role: UserRole;
}

interface UpdateUserStatusInput {
  active: boolean;
}

async function ensureRole(companyId: string, roleName: UserRole) {
  const existingRole = await prisma.role.findFirst({
    where: {
      companyId,
      name: roleName,
    },
  });

  if (existingRole) {
    return existingRole;
  }

  return prisma.role.create({
    data: {
      companyId,
      name: roleName,
    },
  });
}

export async function createUser(data: CreateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const role = await ensureRole(data.companyId, data.role);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      companyId: data.companyId,
      roleId: role.id,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role.name,
    active: user.active,
  };
}

export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      role: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map((user) => ({
    ...user,
    role: user.role.name,
  }));
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      createdAt: true,
      updatedAt: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    ...user,
    role: user.role.name,
  };
}

export async function updateUser(id: string, data: UpdateUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const role = await ensureRole(existingUser.companyId, data.role);

  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      email: data.email,
      roleId: role.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      updatedAt: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...user,
    role: user.role.name,
  };
}

export async function updateUserStatus(id: string, data: UpdateUserStatusInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const user = await prisma.user.update({
    where: {
      id,
    },
    data: {
      active: data.active,
    },
    select: {
      id: true,
      name: true,
      email: true,
      active: true,
      updatedAt: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    ...user,
    role: user.role.name,
  };
}