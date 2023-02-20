import { prisma } from "~/db.server";
import type { Place } from "@prisma/client";

export function getPlaces() {
  return prisma.place.findMany({
    orderBy: { title: "asc" },
  });
}

export function getPlace(id: Place["id"]) {
  return prisma.place.findFirst({
    where: { id },
    include: {
      migrationSteps: {
        include: { migration: true },
        orderBy: {
          startDate: 'asc',
        }
      },
    },
  });
}

export function getPlaceByTitle(title: Place["title"]) {
  return prisma.place.findFirst({
    where: { title },
  });
}
