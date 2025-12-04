// components/common/HeaderMain.tsx

"use client";

import {
  FilePenLine,
  Heart,
  History,
  LogOut,
  MessageSquareIcon,
  Menu,
  Settings,
  User,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { memo, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { MicrosoftAvatar } from "./MicrosoftAvatar";
import { useSidebar } from "@/components/ui/sidebar";
import { useOptimizedSession } from "@/hooks/useOptimizedSession";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AgentMenuBar } from "@/components/agentes/agente-menubar";
import { useAgent } from "@/app/contexts/AgentContext";
import { useFavoritosStats } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const HeaderMain = memo(() => {
  const router = useRouter();
  const { open, setOpen } = useSidebar();
  const { session } = useOptimizedSession();
  const [sidebarOpen, setSidebarOpen] = useLocalStorage('sidebar-open', false);
  const { selectedAgent, setSelectedAgent } = useAgent();
  const { role } = useAuth();
  const pathname = usePathname();
  const shouldShowAgentMenus = role === "admin" && pathname?.startsWith("/inteligencia-artificial");

  // Obter contagem de favoritos
  const { totalGeral: favoritosCount } = useFavoritosStats(session?.user?.id_user || null);

  // Sincronizar o estado do localStorage com o contexto da sidebar
  useEffect(() => {
    setOpen(sidebarOpen);
  }, [sidebarOpen, setOpen]);

  const handleNewChat = useCallback(() => {
    router.push(`/new`);
  }, [router]);

  const handleConversas = useCallback(() => {
    router.push("/conversas");
  }, [router]);

  const handleFavoritos = useCallback(() => {
    router.push("/paciente/favoritos");
  }, [router]);

  const handleToggleSidebar = useCallback(() => {
    const newState = !open;
    setOpen(newState);
    setSidebarOpen(newState);
  }, [open, setOpen, setSidebarOpen]);

  const handleProfile = useCallback(() => {
    router.push("/perfil");
  }, [router]);

  const handleConfiguracoes = useCallback(() => {
    router.push("/configuracoes");
  }, [router]);

  const handleLogout = useCallback(async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  }, []);

  return (
    <header className="fixed px-2 sm:px-4 top-0 z-30 w-full bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex h-14 sm:h-16 items-center justify-between mx-auto w-full">
        <div className="flex items-center gap-2 sm:gap-3 ">
          <div className="flex items-center gap-1 sm:gap-2">
            <MessageSquareIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              {process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 sm:h-9 sm:w-9 rounded-lg hover:bg-muted transition-colors ml-12"
            onClick={handleToggleSidebar}
            title={open ? "Ocultar menu lateral" : "Mostrar menu lateral"}
          >
            <Menu className="h-10 w-10 sm:h-5 sm:w-5 text-foreground" />
          </Button>

          {/* AgentMenuBar no lado direito */}
          {shouldShowAgentMenus && (
            <div className="hidden md:block">
              <AgentMenuBar
                selectedAgent={selectedAgent}
                onSelectAgent={setSelectedAgent}
              />
            </div>
          )}

        </div>

        <div className="flex items-center gap-1 sm:gap-4 text-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 px-3 hover:bg-muted transition-colors"
            onClick={handleConversas}
            title="Histórico de conversas"
          >
            <History className="h-4 w-4" />
            <span className="hidden lg:inline">Histórico</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 hover:bg-muted transition-colors"
            onClick={handleConversas}
            title="Histórico de conversas"
          >
            <History className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="hidden md:flex items-center gap-2 px-3 hover:bg-muted transition-colors relative"
            onClick={handleFavoritos}
            title="Meus favoritos"
          >
            <Heart className="h-4 w-4" />
            <span className="hidden lg:inline">Favoritos</span>
            {favoritosCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {favoritosCount > 99 ? '99+' : favoritosCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 hover:bg-muted transition-colors relative"
            onClick={handleFavoritos}
            title="Meus favoritos"
          >
            <Heart className="h-4 w-4" />
            {favoritosCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {favoritosCount > 9 ? '9+' : favoritosCount}
              </span>
            )}
          </Button>

          <Button
            variant="default"
            size="sm"
            className="hidden sm:flex items-center gap-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all duration-200 hover:shadow-md"
            onClick={handleNewChat}
            title="Nova conversa"
          >
            <FilePenLine className="h-4 w-4" />
            <span className="hidden lg:inline">Nova conversa</span>
            <span className="lg:hidden">Nova</span>
          </Button>


          <Button
            variant="default"
            size="icon"
            className="sm:hidden h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={handleNewChat}
            title="Nova conversa"
          >
            <FilePenLine className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full p-1 hover:bg-muted transition-colors ml-1 sm:ml-2"
                aria-label="Menu do usuário"
              >
                <div className="relative">
                  <MicrosoftAvatar
                    user={session?.user || null}
                    size="sm"
                    className="ring-2 ring-background shadow-sm sm:w-8 sm:h-8"
                  />
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 bg-popover border border-border shadow-xl rounded-lg"
              sideOffset={8}
            >
              {session?.user && (
                <div className="px-3 py-2 border-b border-border">
                  <div className="font-medium text-popover-foreground truncate">
                    {session.user.name || "Usuário"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {session.user.email}
                  </div>
                </div>
              )}

              <DropdownMenuItem
                onClick={handleProfile}
                className="cursor-pointer px-3 py-2 hover:bg-muted focus:bg-muted"
              >
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="text-popover-foreground">Ver Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleConfiguracoes}
                className="cursor-pointer px-3 py-2 hover:bg-muted focus:bg-muted"
              >
                <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                <span className="text-popover-foreground">Configurações</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-border" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer px-3 py-2 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600 dark:text-red-400 dark:hover:bg-red-950/50 dark:focus:bg-red-950/50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
});

HeaderMain.displayName = "HeaderMain";

export default HeaderMain;
