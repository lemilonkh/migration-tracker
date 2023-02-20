import type { User, Observation, Migration, Place } from "@prisma/client";

import { prisma } from "~/db.server";

export type { Observation } from "@prisma/client";

export function getObservation({
  id,
}: Pick<Observation, "id"> & {
  userId: User["id"];
}) {
  return prisma.observation.findFirst({
    include: {
      place: true,
      user: true,
      migration: true,
    },
    where: { id },
  });
}

export function getObservationListItems({ userId }: { userId: User["id"] }) {
  return prisma.observation.findMany({
    where: { userId },
    select: { id: true, title: true },
    orderBy: { updatedAt: "desc" },
  });
}

export function createObservation({
  title,
  description,
  imageUrl,
  migrationId,
  placeId,
  userId
}: Pick<Observation, "description" | "title" | "imageUrl" | "imageUrl"> & {
  userId: User["id"];
  migrationId: Migration["id"];
  placeId: Place["id"];
}) {
  return prisma.observation.create({
    data: {
      title,
      description,
      imageUrl,
      migration: {
        connect: {
          id: migrationId,
        }
      },
      place: {
        connect: {
          id: placeId,
        }
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function deleteObservation({
  id,
  userId,
}: Pick<Observation, "id"> & { userId: User["id"] }) {
  return prisma.observation.deleteMany({
    where: { id, userId },
  });
}
