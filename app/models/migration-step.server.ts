import type { User, Migration, MigrationStep, Place } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Migration } from "@prisma/client";

export function getMigrationStep({
  id,
}: Pick<Migration, "id"> & {
  userId: User["id"];
}) {
  return prisma.migrationStep.findFirst({
    include: {
      place: true,
    },
    where: { id },
  });
}

export function getMigrationStepListItems({ migrationId }: { migrationId: Migration["id"] }) {
  return prisma.migrationStep.findMany({
    where: { migrationId },
    include: { place: true },
    orderBy: { startDate: "asc" },
  });
}

export function createMigrationStep({
  startDate,
  endDate,
  migrationId,
}: Pick<MigrationStep, "startDate" | "endDate"> & {
  migrationId: Migration["id"];
}, { title, latitude, longitude }: Pick<Place, "title" | "latitude" | "longitude">) {
  return prisma.migrationStep.create({
    data: {
      startDate,
      endDate,
      place: {
        connectOrCreate: {
          where: {
            title,
          },
          create: {
            title,
            latitude,
            longitude,
          },
        },
      },
      migration: {
        connect: {
          id: migrationId,
        },
      },
    },
  });
}

export function deleteMigrationStep({
  id,
  userId,
}: Pick<MigrationStep, "id"> & { userId: User["id"] }) {
  return prisma.migrationStep.deleteMany({
    where: { id, migration: { userId } },
  });
}
