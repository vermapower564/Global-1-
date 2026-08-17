import { redirect } from "next/navigation";

export default function RootLoginAliasPage() {
  redirect("/auth/login");
}
