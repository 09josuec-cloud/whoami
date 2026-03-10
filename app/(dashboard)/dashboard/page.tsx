import type { Metadata } from "next";
import { auth } from "@/src/lib/auth";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return <DashboardClient firstName={firstName} />;
}
