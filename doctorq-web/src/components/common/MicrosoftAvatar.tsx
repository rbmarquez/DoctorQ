"use client";

import { UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useState } from "react";

interface MicrosoftAvatarProps {
  user?: {
    name?: string | null;
  } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export function MicrosoftAvatar({
  user: propUser,
  size = "md",
  className = "",
  onClick,
}: MicrosoftAvatarProps) {
  const { data: session, status } = useSession();
  const [isLoading, _setIsLoading] = useState(false);

  // Usar usuário da sessão se não foi passado como prop
  const user = propUser || session?.user;

  // Diferentes tamanhos
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  // Gerar iniciais do nome
  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };


  // Se não estiver autenticado, mostrar avatar genérico
  if (status !== "authenticated" || !user) {
    return (
      <Avatar
        className={`${sizeClasses[size]} ${className} cursor-pointer hover:ring-2 hover:ring-gray-200 transition-all`}
        onClick={onClick}
      >
        <AvatarFallback className="bg-gray-100 text-gray-500">
          <UserIcon className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar
      className={`${sizeClasses[size]} ${className} cursor-pointer hover:ring-2 hover:ring-indigo-200 transition-all`}
      onClick={onClick}
    >

      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-medium">
        {isLoading ? (
          <div className="animate-spin rounded-full h-3 w-3 border border-indigo-300 border-t-indigo-600"></div>
        ) : user.name ? (
          getUserInitials(user.name)
        ) : (
          <UserIcon className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}
