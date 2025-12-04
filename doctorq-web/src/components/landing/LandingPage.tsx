"use client";

import { useState } from "react";
import { HeroSection } from "./HeroSection";
import { ProceduresSection } from "./ProceduresSection";
import { ProductBannerSection } from "./ProductBannerSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { TestimonialsSection } from "./TestimonialsSection";
import { StatsSection } from "./StatsSection";
import { CTASection } from "./CTASection";
import { LandingNav } from "./LandingNav";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FFF5F7', colorScheme: 'light only' }}>
      <div className="bg-gradient-to-b from-blue-100 via-cyan-50 to-purple-50">
        {/* Navegação */}
        <LandingNav />

        {/* Hero Section */}
        <HeroSection />

        {/* Categorias de Procedimentos */}
        <ProceduresSection />

        {/* Produtos & Equipamentos Profissionais */}
        <ProductBannerSection />

        {/* Como Funciona */}
        <HowItWorksSection />

        {/* Estatísticas */}
        <StatsSection />

        {/* Depoimentos */}
        <TestimonialsSection />

        {/* CTA Final */}
        <CTASection />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
