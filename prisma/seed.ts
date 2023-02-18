import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "milangruner@gmail.com";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("birdsarecool", 10);

  const user = await prisma.user.create({
    data: {
      email,
      role: 'BIOLOGIST',
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.migration.create({
    data: {
      title: "My first note",
      description: "Hello, world!",
      species: {
        create: {
          title: 'Test Species',
          description: 'This is a test',
          imageUrl: '/img/perched_kingfisher.jpg'
        }
      },
      user: {
        connect: {
          id: user.id,
        }
      }
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
