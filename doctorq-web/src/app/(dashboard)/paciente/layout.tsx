"use client";

import { ClienteSidebar } from "@/components/layout/ClienteSidebar";
import { RouteGuard } from "@/components/guards";

export default function PacienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard fallbackUrl="/paciente/dashboard">
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 flex-shrink-0">
          <ClienteSidebar />
        </div>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </RouteGuard>
  );
}
