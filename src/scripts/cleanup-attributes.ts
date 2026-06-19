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

  console.log("Starting cleanup of 'Graphics' attribute...");


  const deletedSpecs = await prisma.productSpec.deleteMany({
    where: {
      attribute: {
        name: "Graphics",
      },
    },
  });
  console.log(`Deleted ${deletedSpecs.count} product specs for 'Graphics'.`);


  const deletedAttr = await prisma.specAttribute.deleteMany({
    where: {
      name: "Graphics",
    },
  });
  console.log(`Deleted ${deletedAttr.count} spec attribute(s) named 'Graphics'.`);

  await prisma.$disconnect();
  console.log("Cleanup complete!");
}

main().catch(console.error);
