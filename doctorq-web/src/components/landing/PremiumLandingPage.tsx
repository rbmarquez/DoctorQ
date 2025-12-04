"use client";

import { PremiumNav } from "./PremiumNav";
import { LuxuryHeroSection } from "./LuxuryHeroSection";
import { DriftImageGrid } from "./DriftImageGrid";
import { FeaturedProfessionals } from "./FeaturedProfessionals";
import { DualAccessVisual } from "./DualAccessVisual";
import { UniversityPreview } from "./UniversityPreview";
import { CareersPreview } from "./CareersPreview";
import { Footer } from "./Footer";

export function PremiumLandingPage() {
  return (
    <div className="min-h-screen">
      {/* Premium Navigation - z-20 para ficar acima do vídeo */}
      <PremiumNav />

      {/* Hero Luxuoso - Estilo Royal Savoy com vídeo fullscreen */}
      <LuxuryHeroSection />

      {/* Seções após o hero - z-10 e background branco para cobrir vídeo */}
      <div className="relative z-10 bg-white">
        {/* Grid de Procedimentos com Efeito Drift - Estilo Swiss Deluxe */}
        <DriftImageGrid />

        {/* Profissionais em Destaque (Carrossel) */}
        <FeaturedProfessionals />

        {/* Dual Access: Para Você vs Para Profissionais */}
        <DualAccessVisual />


        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
