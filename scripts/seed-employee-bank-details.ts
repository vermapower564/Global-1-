import { prisma } from "../lib/prisma";

const bankNames = [
  "HDFC Bank",
  "State Bank of India",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
];

const ifscPrefixes = ["HDFC000", "SBIN000", "ICIC000", "UTIB000", "KKBK000", "PUNB000", "BARB000"];

async function seedBankDetails() {
  console.log("🏦 Seeding Employee Bank Details into MySQL...\n");

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} users in database.`);

  let createdCount = 0;

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const bankIdx = i % bankNames.length;
    const bankName = bankNames[bankIdx];
    const ifscCode = `${ifscPrefixes[bankIdx]}${1000 + i}`;
    const accountNumber = `9876${10000000 + i * 4321 + 1234}`;
    const branchName = `${["Cyber City", "Bandra Kurla Complex", "Connaught Place", "Whitefield", "Indiranagar", "Sector 62"][i % 6]} Branch`;

    try {
      await prisma.bankdetail.upsert({
        where: { userId: u.id },
        update: {
          accountHolderName: u.name,
          bankName,
          accountNumber,
          ifscCode,
          branchName,
          accountType: "Savings",
          isActive: true,
        },
        create: {
          userId: u.id,
          accountHolderName: u.name,
          bankName,
          accountNumber,
          ifscCode,
          branchName,
          accountType: "Savings",
          isActive: true,
        },
      });
      createdCount++;
      console.log(`✓ [Bank Details Saved] ${u.name} (${u.employeeId}) -> ${bankName} (${ifscCode})`);
    } catch (err: any) {
      console.error(`❌ Error saving bank details for ${u.name}:`, err.message);
    }
  }

  console.log(`\n🎉 Successfully seeded bank details for ${createdCount} employees.\n`);
  await prisma.$disconnect();
}

seedBankDetails();
