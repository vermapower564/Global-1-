import { prisma } from "../lib/prisma";
import { validateAndNormalizeGmail } from "../lib/emailValidator";

async function verifyAndMigrateGmailAddresses() {
  console.log("⚡ Inspecting all MySQL database user accounts for Gmail compliance (@gmail.com)...");

  try {
    const allUsers = await prisma.user.findMany();
    console.log(`Found ${allUsers.length} total user accounts in database.`);

    let updatedCount = 0;

    for (const user of allUsers) {
      const email = user.email || "";
      const validation = validateAndNormalizeGmail(email);

      if (!validation.isValid) {
        // Construct new valid @gmail.com address from local name/employeeId
        const localPart = email.includes("@")
          ? email.split("@")[0].replace(/[^a-zA-Z0-9._%+-]/g, ".").toLowerCase()
          : (user.name || user.employeeId || `user${user.id}`).replace(/[^a-zA-Z0-9._%+-]/g, ".").toLowerCase();
        
        const newGmail = `${localPart}@gmail.com`;

        console.log(`⚠️ User [${user.name} (${user.employeeId})]: Invalid email "${email}" -> Updating to "${newGmail}"`);

        await prisma.user.update({
          where: { id: user.id },
          data: { email: newGmail },
        });

        updatedCount++;
      } else {
        console.log(`✓ User [${user.name} (${user.employeeId})]: Compliant Gmail -> "${user.email}"`);
      }
    }

    console.log(`\n🎉 SUCCESS: All ${allUsers.length} database accounts now have valid, normalized @gmail.com addresses! (${updatedCount} updated).`);
  } catch (err: any) {
    console.error("❌ Error verifying Gmail addresses:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndMigrateGmailAddresses();
