// Seed de développement — jeu de données démontrable (terrain : Beaugrenelle).
// Lancer avec une base PostgreSQL disponible : `pnpm db:seed`.
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "beaugrenelle-demo" },
    update: {},
    create: { name: "Centre Beaugrenelle", slug: "beaugrenelle-demo" },
  });

  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@beaugrenelle.test" } },
    update: { passwordHash: hashPassword("demo1234"), role: "admin", name: "Admin Démo" },
    create: {
      tenantId: tenant.id,
      email: "admin@beaugrenelle.test",
      name: "Admin Démo",
      role: "admin",
      passwordHash: hashPassword("demo1234"),
    },
  });

  const parking = await prisma.parking.upsert({
    where: { slug: "beaugrenelle" },
    update: { isPublished: true },
    create: {
      tenantId: tenant.id,
      name: "Parking Beaugrenelle",
      slug: "beaugrenelle",
      address: "12 Rue Linois",
      city: "Paris",
      postalCode: "75015",
      isPublished: true,
    },
  });

  // Réinitialise la configuration enfant pour rendre le seed idempotent.
  await prisma.space.deleteMany({ where: { parkingId: parking.id } });
  await prisma.zone.deleteMany({ where: { parkingId: parking.id } });
  await prisma.offer.deleteMany({ where: { parkingId: parking.id } });

  const zone = await prisma.zone.create({
    data: { tenantId: tenant.id, parkingId: parking.id, name: "Niveau -1" },
  });

  await prisma.space.createMany({
    data: [
      { tenantId: tenant.id, parkingId: parking.id, zoneId: zone.id, label: "A-01", type: "hourly" },
      { tenantId: tenant.id, parkingId: parking.id, zoneId: zone.id, label: "A-02", type: "hourly" },
      { tenantId: tenant.id, parkingId: parking.id, zoneId: zone.id, label: "A-03", type: "mixed" },
      { tenantId: tenant.id, parkingId: parking.id, zoneId: zone.id, label: "PMR-01", type: "pmr" },
      { tenantId: tenant.id, parkingId: parking.id, zoneId: zone.id, label: "VE-01", type: "ev" },
    ],
  });

  await prisma.offer.create({
    data: {
      tenantId: tenant.id,
      parkingId: parking.id,
      name: "Horaire visiteur",
      type: "hourly",
      description: "Stationnement à l'heure",
      priceRules: {
        create: [{ tenantId: tenant.id, label: "Tarif horaire", unit: "hour", amountInCents: 350 }],
      },
    },
  });

  await prisma.offer.create({
    data: {
      tenantId: tenant.id,
      parkingId: parking.id,
      name: "Forfait journée",
      type: "daily",
      description: "Stationnement à la journée",
      priceRules: {
        create: [{ tenantId: tenant.id, label: "Journée", unit: "day", amountInCents: 1800 }],
      },
    },
  });

  console.log("Seed terminé.");
  console.log(`  Tenant      : ${tenant.slug}`);
  console.log("  Connexion   : admin@beaugrenelle.test / demo1234");
  console.log(`  Parking     : /parkings/${parking.slug} (publié)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
