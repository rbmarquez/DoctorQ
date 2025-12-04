"use client";

import Header from "@/components/common/Header";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/debug-repeat";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />
      <div className="flex flex-1">
        <main className="flex-1 flex flex-col items-center max-w-7xl mx-auto w-full overflow-y-auto">
          <div className="flex-1 flex flex-col w-full p-4">
            {children}
            <Toaster richColors position="top-right" />
          </div>
        </main>
      </div>
    </div>
  );
}
