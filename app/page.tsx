import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/authService";

const ADMIN_ROLES = ["SUPER_ADMIN", "DIRECTOR", "HR", "FINANCE", "PROJECT_MANAGER"];

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("oms_session")?.value;

  if (!token) {
    redirect("/auth/login");
  }

  const session = verifyToken(token);

  if (!session || !session.id) {
    redirect("/auth/login");
  }

  const userRole = (session.role || "").toUpperCase();
  if (ADMIN_ROLES.includes(userRole)) {
    redirect("/admin");
  } else {
    redirect("/employee");
  }
}