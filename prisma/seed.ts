import { PrismaClient, Role } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("#31PulpFiction10", 12);

  await db.user.upsert({
    where: { email: "roydench31@gmail.com" },
    update: {},
    create: {
      email: "roydench31@gmail.com",
      name: "Roy Dench",
      password: passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed complete: admin user created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void db.$disconnect());
