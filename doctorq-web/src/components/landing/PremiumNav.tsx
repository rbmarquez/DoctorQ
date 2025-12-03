"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Search,
  MapPin,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PremiumNav() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);
    const queryString = params.toString();
    router.push(queryString ? `/busca?${queryString}` : "/busca");
  };

  const isAuthenticated = status === "authenticated" && session?.user;

  const getDashboardUrl = () => {
    if (!session?.user) return "/admin/dashboard";
    const role = (session.user as any).role || "paciente";
    switch (role) {
      case "admin":
      case "gestor_empresa":
        return "/admin/dashboard";
      case "profissional":
        return "/profissional/dashboard";
      case "paciente":
        return "/paciente/dashboard";
      default:
        return "/admin/dashboard";
    }
  };

  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    const names = session.user.name.split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return session.user.name[0].toUpperCase();
  };

  return (
    <>
      <header
        className={`fixed w-full z-50 transition-all duration-500 ease-out ${
          isScrolled
            ? "bg-white shadow-lg py-3"
            : "bg-black/70 backdrop-blur-md py-4"
        }`}
      >
        <div className="w-full px-6 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between">
            {/* Logo - Esquerda */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                  isScrolled
                    ? "bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 shadow-lg shadow-blue-500/30"
                    : "bg-gradient-to-br from-blue-500/80 via-blue-600/80 to-cyan-600/80 border border-white/30"
                } group-hover:scale-110 group-hover:rotate-3`}
              >
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-2xl font-bold tracking-tight transition-all duration-500 ${
                    isScrolled
                      ? "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 bg-clip-text text-transparent"
                      : "text-white"
                  }`}
                >
                  DoctorQ
                </span>
                <span className={`text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-500 ${
                  isScrolled ? "text-gray-500" : "text-blue-300"
                }`}>
                  Sua saúde em primeiro lugar
                </span>
              </div>
            </Link>

            {/* Centro - Barra de Busca (aparece após scroll) - Mesmo estilo do Hero */}
            {isScrolled && (
              <div className="hidden lg:flex items-center justify-center flex-1 max-w-3xl mx-8">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleNavSearch();
                  }}
                  className="bg-gray-50 rounded-full shadow-lg border-2 border-gray-200 hover:border-blue-300 flex items-center overflow-hidden w-full"
                >
                  {/* Campo Procedimento */}
                  <div className="flex-1 flex items-center px-6 py-4 border-r border-gray-200">
                    <Stethoscope className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Consulta, Exame, Especialidade..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-600 focus:outline-none text-base font-medium"
                    />
                  </div>

                  {/* Campo Localização */}
                  <div className="flex-1 flex items-center px-6 py-4">
                    <MapPin className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Cidade ou bairro"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-transparent text-gray-900 placeholder:text-gray-600 focus:outline-none text-base font-medium"
                    />
                  </div>

                  {/* Botão de Busca */}
                  <button
                    type="submit"
                    aria-label="Buscar tratamentos"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 m-1.5 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </form>
              </div>
            )}

            {/* Direita - Botões de Ação */}
            <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={`gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 h-auto ${
                        isScrolled
                          ? "hover:bg-gray-100"
                          : "text-white hover:bg-white/20"
                      }`}
                    >
                      <Avatar className="h-9 w-9 ring-2 ring-white/50">
                        <AvatarImage src={session.user?.image || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-sm font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`text-sm font-semibold ${isScrolled ? "text-gray-800" : "text-white"}`}>
                        Olá, {session.user?.name?.split(" ")[0] || "Usuário"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-60 bg-white border border-gray-200 shadow-2xl rounded-2xl p-2 mt-2"
                  >
                    <DropdownMenuLabel className="px-3 py-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
                        <p className="text-xs text-gray-500">{session.user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-gray-100 my-1" />
                    <DropdownMenuItem asChild className="px-3 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl cursor-pointer">
                      <Link href={getDashboardUrl()}>
                        <LayoutDashboard className="mr-3 h-4 w-4" />
                        Meu Painel
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="px-3 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl cursor-pointer">
                      <Link href={`${getDashboardUrl()}/perfil`}>
                        <User className="mr-3 h-4 w-4" />
                        Meu Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-100 my-1" />
                    <DropdownMenuItem asChild className="px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Link href="/api/auth/signout">
                        <LogOut className="mr-3 h-4 w-4" />
                        Sair
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-3">
                  {/* Link Entrar - Alta visibilidade */}
                  <Link
                    href="/login"
                    className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all duration-300 ${
                      isScrolled
                        ? "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        : "text-white bg-white/20 hover:bg-white/30 border border-white/40"
                    }`}
                  >
                    Entrar
                  </Link>

                  {/* Botão Cadastrar Empresa - Destaque Medical */}
                  <Link
                    href="/registro-empresa"
                    className={`group relative flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl overflow-hidden transition-all duration-300 ${
                      isScrolled
                        ? "bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
                        : "bg-white text-gray-900 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="relative">Cadastrar Empresa</span>
                    <ArrowRight className="w-4 h-4 relative transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-3 rounded-xl transition-all duration-300 ${
                isScrolled
                  ? "hover:bg-gray-100 text-gray-700"
                  : "hover:bg-white/20 text-white"
              }`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Overlay Style */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={`absolute top-20 left-4 right-4 bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
            isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          }`}
        >
          <div className="p-6 space-y-4">
            {isAuthenticated ? (
              <>
                {/* User Info */}
                <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
                  <Avatar className="h-14 w-14 ring-2 ring-blue-500/20">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {session.user?.name?.split(" ")[0] || "Usuário"}
                    </p>
                    <p className="text-sm text-gray-500">{session.user?.email}</p>
                  </div>
                </div>

                {/* Menu Links */}
                <Link
                  href={getDashboardUrl()}
                  className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium">Meu Painel</span>
                </Link>
                <Link
                  href={`${getDashboardUrl()}/perfil`}
                  className="flex items-center gap-4 px-4 py-4 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-2xl transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium">Meu Perfil</span>
                </Link>
                <Link
                  href="/api/auth/signout"
                  className="flex items-center gap-4 px-4 py-4 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-2xl transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <span className="font-medium">Sair</span>
                </Link>
              </>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-4 text-center text-gray-700 font-semibold border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar / Inscrever-se
                </Link>
                <Link
                  href="/registro-empresa"
                  className="flex items-center justify-center gap-2 w-full py-4 text-center text-white font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cadastrar sua Empresa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
