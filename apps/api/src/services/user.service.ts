import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "ENGINEER";
  companyId: string;
}

interface UpdateUserInput {
  name: string;
  email: string;
  role: "ADMIN" | "MANAGER" | "ACCOUNTANT" | "ENGINEER";
}

interface UpdateUserStatusInput {
  active: boolean;
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

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

export async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
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
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUser(
  id: string,
  data: UpdateUserInput
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  return prisma.user.update({
    where: {
      id,
    },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      updatedAt: true,
    },
  });
}

export async function updateUserStatus(
  id: string,
  data: UpdateUserStatusInput
) {
  const existingUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  return prisma.user.update({
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
      role: true,
      active: true,
      updatedAt: true,
    },
  });
}