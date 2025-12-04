"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ";

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Sparkles className="h-8 w-8 text-blue-500 group-hover:text-blue-600 transition-colors" />
              <div className="absolute inset-0 bg-blue-500/20 blur-xl group-hover:bg-blue-600/30 transition-all" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {appName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#clinicas"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Clínicas/Profissionais
            </Link>
            <Link
              href="#procedimentos"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Procedimentos
            </Link>
            <Link
              href="#produtos"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Produtos & Equipamentos
            </Link>
            <Link
              href="/parceiros"
              className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
            >
              Seja Parceiro
            </Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="ghost" className="text-gray-700 hover:text-blue-600">
              <Link href="/login">Entrar</Link>
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg shadow-pink-500/50"
            >
              <Link href="/cadastro">Cadastre-se</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-gray-700" />
            ) : (
              <Menu className="h-6 w-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t border-blue-100">
            <Link
              href="#procedimentos"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Procedimentos
            </Link>
            <Link
              href="#clinicas"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Clínicas
            </Link>
            <Link
              href="#profissionais"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profissionais
            </Link>
            <Link
              href="#produtos"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Produtos & Equipamentos
            </Link>
            <Link
              href="/parceiros"
              className="block px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Seja Parceiro
            </Link>
            <div className="pt-4 space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                <Link href="/cadastro">Cadastre-se</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
