"use client";

import Link from "next/link";
import { Button } from "./button";
import { ThemeToggle } from "./theme-toggle";

export default function Header() {
  return (
    <header className="w-full border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-lg">
            Meu App
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:underline">
              Home
            </Link>
            <Link href="/chat" className="text-sm font-medium hover:underline">
              Chat
            </Link>
            <Link
              href="/configuracoes"
              className="text-sm font-medium hover:underline"
            >
              Configurações
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2">
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/registro">
              <Button>Cadastrar</Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
