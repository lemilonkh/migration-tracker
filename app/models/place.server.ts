import { prisma } from "~/db.server";

export function getPlaces() {
  return prisma.place.findMany({
    orderBy: { title: "asc" },
  });
}
