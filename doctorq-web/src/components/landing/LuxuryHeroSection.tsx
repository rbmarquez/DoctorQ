"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Stethoscope, X, Activity, LogIn, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function LuxuryHeroSection() {
  const router = useRouter();
  const { data: session } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showAuthPopup, setShowAuthPopup] = useState(false);

  // Animação de entrada
  useEffect(() => {
    const timer1 = setTimeout(() => setIsVisible(true), 100);
    const timer2 = setTimeout(() => setFiltersVisible(true), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleSearch = () => {
    // Se os campos estiverem vazios, mostrar popup
    if (!searchQuery.trim() && !location.trim()) {
      setShowPopup(true);
      return;
    }

    // Se tiver algum campo preenchido, vai direto para busca
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("local", location);
    router.push(`/busca?${params.toString()}`);
  };

  const handleBuscaNormal = () => {
    setShowPopup(false);
    router.push("/busca");
  };

  const handleBuscaInteligente = () => {
    setShowPopup(false);
    if (session) {
      // Usuário logado, vai direto para busca inteligente
      router.push("/paciente/busca-inteligente");
    } else {
      // Usuário não logado, mostra popup de login/cadastro
      setShowAuthPopup(true);
    }
  };

  const handleLogin = () => {
    setShowAuthPopup(false);
    router.push("/login?callbackUrl=/paciente/busca-inteligente");
  };

  const handleCadastro = () => {
    setShowAuthPopup(false);
    router.push("/registro?callbackUrl=/paciente/busca-inteligente");
  };

  return (
    <section id="hero-section" className="hero-section relative h-screen overflow-hidden">
      {/* Image Background - Medical Theme */}
      <div className="hero__bg absolute inset-0">
        {/* Imagem de fundo médica moderna */}
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat z-0"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070)',
          }}
        />
        {/* Gradient overlay azul médico */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-800/40 to-blue-900/70 z-[1]" />

        {/* Animated particles effect */}
        <div className="absolute inset-0 z-[2] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      {/* Conteúdo Central - Título */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center pt-20 pb-32">
        <h1
          className={`font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white font-light leading-tight max-w-[340px] md:max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          Sua saúde em
          <br />
          primeiro lugar
        </h1>
        <p
          className={`mt-6 text-white/80 text-lg md:text-xl font-light tracking-wide transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Conectamos você com os melhores médicos e profissionais de saúde
        </p>
      </div>

      {/* Barra de Busca - Posição inferior centralizada */}
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 transition-all duration-700 ${
          filtersVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="bg-white/95 backdrop-blur-sm rounded-full shadow-2xl flex items-center overflow-hidden"
        >
          {/* Campo Tratamento */}
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
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 m-1.5 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Popup de escolha de busca */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPopup(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-semibold text-white">
                Como você quer buscar?
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Escolha o tipo de busca ideal para você
              </p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Opção Busca Normal */}
              <button
                onClick={handleBuscaNormal}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-3 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <Search className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Busca</h4>
                  <p className="text-sm text-gray-500">
                    Explore todos os profissionais e serviços médicos
                  </p>
                </div>
              </button>

              {/* Opção Busca Inteligente */}
              <button
                onClick={handleBuscaInteligente}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-blue-400 hover:from-blue-100 hover:to-cyan-100 transition-all group"
              >
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Busca Inteligente</h4>
                  <p className="text-sm text-gray-500">
                    Nossa IA encontra o atendimento ideal para você
                  </p>
                </div>
                <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded-full">
                  IA
                </span>
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Popup de Login/Cadastro */}
      {showAuthPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAuthPopup(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
              <button
                onClick={() => setShowAuthPopup(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-white" />
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Busca Inteligente
                  </h3>
                  <p className="text-white/80 text-sm">
                    Entre ou cadastre-se para continuar
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 text-sm text-center">
                Para usar a Busca Inteligente com IA, precisamos conhecer você melhor e personalizar sua experiência.
              </p>

              {/* Opção Login */}
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="p-3 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                  <LogIn className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Entrar</h4>
                  <p className="text-sm text-gray-500">
                    Já tenho uma conta
                  </p>
                </div>
              </button>

              {/* Opção Cadastro */}
              <button
                onClick={handleCadastro}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 hover:border-blue-400 hover:from-blue-100 hover:to-cyan-100 transition-all group"
              >
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <UserPlus className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-gray-800">Criar conta</h4>
                  <p className="text-sm text-gray-500">
                    É rápido e gratuito
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
