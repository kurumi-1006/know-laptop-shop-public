import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const connectionUrl = new URL(databaseUrl);
  if (connectionUrl.searchParams.get("sslmode") === "require") {
    connectionUrl.searchParams.set("sslmode", "verify-full");
  }

  const adapter = new PrismaPg({
    connectionString: connectionUrl.toString(),
  });
  const prisma = new PrismaClient({ adapter });

  const attributes = await prisma.specAttribute.findMany({
    include: {
      _count: {
        select: { productSpecs: true }
      }
    }
  });

  console.log("=== Spec Attributes in Database ===");
  console.log(JSON.stringify(attributes, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
