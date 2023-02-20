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

type OptionalPick<T, K extends PropertyKey> = Pick<T, Extract<keyof T, K>>;

export function createMigrationStep({
  startDate,
  endDate,
  migrationId,
  title,
  latitude,
  longitude,
}: Pick<MigrationStep, "startDate" | "endDate"> & {
  migrationId: Migration["id"];
} & OptionalPick<Place, "latitude" | "longitude"> & Pick<Place, "title">) {
  // ensure the same year for each migration step,
  // since we are only interested in months and days
  const normalizedStartDate = new Date(startDate);
  normalizedStartDate.setFullYear(2023);
  const normalizedEndDate = new Date(endDate);
  normalizedEndDate.setFullYear(2023);
  
  return prisma.migrationStep.create({
    data: {
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
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
