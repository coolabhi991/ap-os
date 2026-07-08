import bcrypt from "bcrypt";
import { UserRole } from "@prisma/client";
import prisma from "../config/prisma.js";
import { generateToken } from "../config/jwt.js";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

type RoleName = UserRole;

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

export async function registerUser(data: RegisterUserInput) {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const company = await prisma.company.create({
    data: {
      name: "AP OS",
    },
  });

  const role = await ensureRole(company.id, "ADMIN");

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      companyId: company.id,
      roleId: role.id,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: role.name,
    companyId: company.id,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role.name,
    companyId: user.companyId,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      companyId: user.companyId,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
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
      company: {
        select: {
          id: true,
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