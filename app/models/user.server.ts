import type { Password, Place, User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { prisma } from "~/db.server";

export type { User } from "@prisma/client";

export enum UserRole {
  Citizen = "CITIZEN",
  Biologist = "BIOLOGIST",
}

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function createUser(email: User["email"], password: string, role: UserRole) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      role,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function setUserPlace(id: User["id"], placeId: Place["id"]) {
  return prisma.user.update({
    where: { id },
    data: {
      location: {
        connect: {
          id: placeId,
        }
      }
    },
  })
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function getUsersWithMigrations() {
  return prisma.user.findMany({
    include: {
      location: {
        include: {
          migrationSteps: {
            include: { migration: true },
          },
        },
      },
    },
  });
}
