"use client";

import { ProfessionalBadge as BadgeType } from "@/types/review";
import { BadgeCheck, Award, Star, TrendingUp, Shield, Clock } from "lucide-react";

interface ProfessionalBadgeProps {
  badge: BadgeType;
}

export function ProfessionalBadge({ badge }: ProfessionalBadgeProps) {
  const iconMap: Record<string, React.ElementType> = {
    verificado: BadgeCheck,
    premium: Award,
    top_rated: Star,
    trending: TrendingUp,
    authentic: Shield,
    fast_response: Clock,
  };

  const Icon = iconMap[badge.ds_icone] || BadgeCheck;

  return (
    <div
      className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm"
      style={{
        backgroundColor: `${badge.ds_cor}20`,
        color: badge.ds_cor,
        borderColor: badge.ds_cor,
        borderWidth: "1px",
      }}
      title={badge.ds_descricao}
    >
      <Icon className="h-4 w-4" />
      <span>{badge.nm_badge}</span>
    </div>
  );
}
