import type { User, Migration } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Migration } from "@prisma/client";

export function getMigration({
  id,
  userId,
}: Pick<Migration, "id"> & {
  userId: User["id"];
}) {
  return prisma.migration.findFirst({
    select: { id: true, description: true, title: true },
    where: { id, userId },
  });
}

export function getMigrationListItems({ userId }: { userId: User["id"] }) {
  return prisma.migration.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createMigration({
  title,
  description,
  species,
  userId,
  imageUrl,
}: Pick<Migration, "description" | "title" | "species" | "imageUrl"> & {
  userId: User["id"];
}) {
  return prisma.migration.create({
    data: {
      title,
      description,
      species,
      imageUrl,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteMigration({
  id,
  userId,
}: Pick<Migration, "id"> & { userId: User["id"] }) {
  return prisma.migration.deleteMany({
    where: { id, userId },
  });
}
