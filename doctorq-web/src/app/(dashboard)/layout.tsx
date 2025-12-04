"use client";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rotas que têm seu próprio layout completo (não usam AuthenticatedLayout)
  const skipAuthLayout = pathname?.startsWith("/clinica");

  if (skipAuthLayout) {
    return <>{children}</>;
  }

  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
