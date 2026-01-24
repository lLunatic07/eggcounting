import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking database content...");

  try {
    const userCount = await prisma.user.count();
    console.log(`📊 Total Users: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany();
      console.log("👥 First found user:", users[0].username);
    }

    const eggCount = await prisma.eggCount.findFirst();
    console.log("🥚 Egg Count Record:", eggCount);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
