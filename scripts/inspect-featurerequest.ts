import { prisma } from "../lib/prisma";

async function inspectFeatureRequestTable() {
  try {
    const cols: any = await prisma.$queryRawUnsafe("DESCRIBE featurerequest");
    console.log("featurerequest columns:", cols);
  } catch (err: any) {
    console.error("Error inspecting featurerequest:", err.message);
  }
}

inspectFeatureRequestTable();
