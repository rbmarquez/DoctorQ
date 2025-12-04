"use client";

import { Sparkles, Instagram, Facebook, Linkedin, Twitter, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "DoctorQ";
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="px-8 lg:px-16 py-16">
        {/* Main Footer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <Sparkles className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                {appName}
              </span>
            </Link>
            <p className="text-gray-400 text-sm">
              Conectando você aos melhores profissionais de estética do Brasil.
            </p>
            {/* Social Media */}
            <div className="flex space-x-4">
              <a
                href="#"
                className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2 bg-gray-800 rounded-full hover:bg-blue-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Para Clientes */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Clientes</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/busca?tipo=profissional" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Buscar Profissionais
                </Link>
              </li>
              <li>
                <Link href="/busca?tipo=clinica" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Buscar Clínicas
                </Link>
              </li>
              <li>
                <Link href="/procedimentos" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Procedimentos
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="/marketplace/avaliacoes" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Avaliações
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Profissionais */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Profissionais</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/parceiros" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Cadastrar Clínica
                </Link>
              </li>
              <li>
                <Link href="/parceiros" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Cadastrar Profissional
                </Link>
              </li>
              <li>
                <Link href="/parceiros" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link href="/ajuda" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Central de Ajuda
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contato</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <a
                    href="mailto:contato@aiquebeleza.com"
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    contato@aiquebeleza.com
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Telefone</div>
                  <a
                    href="tel:+551140028922"
                    className="text-gray-300 hover:text-blue-400 transition-colors"
                  >
                    (61) 9996-3256
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Endereço</div>
                  <p className="text-gray-300">
                    Brasília, DF, Brasil
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © {currentYear} {appName}. Todos os direitos reservados.
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link href="/legal/termos-servico" className="text-gray-500 hover:text-blue-400 transition-colors">
                Termos de Uso
              </Link>
              <Link href="/legal/privacidade" className="text-gray-500 hover:text-blue-400 transition-colors">
                Política de Privacidade
              </Link>
              <Link href="/legal/cookies" className="text-gray-500 hover:text-blue-400 transition-colors">
                Cookies
              </Link>
              <Link href="/ajuda" className="text-gray-500 hover:text-blue-400 transition-colors">
                Ajuda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
